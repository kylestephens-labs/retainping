import { supabaseAdmin } from './supabase';

// Monitoring and alerting utilities
interface ImportMetrics {
  totalImports: number;
  successfulImports: number;
  failedImports: number;
  totalMembersImported: number;
  averageImportSize: number;
  duplicateRate: number;
  errorRate: number;
}

interface AlertConfig {
  errorRateThreshold: number; // Percentage
  duplicateRateThreshold: number; // Percentage
  failureCountThreshold: number; // Absolute number
}

const DEFAULT_ALERT_CONFIG: AlertConfig = {
  errorRateThreshold: 20, // 20% error rate
  duplicateRateThreshold: 50, // 50% duplicate rate
  failureCountThreshold: 5 // 5 consecutive failures
};

async function getImportMetrics(userId: string, hours: number = 24): Promise<ImportMetrics> {
  try {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    
    // Get all import events for the user
    const { data: events } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('type', 'import_success')
      .gte('timestamp', since)
      .like('metadata', `%"user_id":"${userId}"%`);
    
    const { data: errorEvents } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('type', 'import_error')
      .gte('timestamp', since)
      .like('metadata', `%"user_id":"${userId}"%`);
    
    const totalImports = (events?.length || 0) + (errorEvents?.length || 0);
    const successfulImports = events?.length || 0;
    const failedImports = errorEvents?.length || 0;
    
    // Calculate metrics from successful imports
    let totalMembersImported = 0;
    let totalDuplicates = 0;
    
    events?.forEach(event => {
      try {
        const metadata = JSON.parse(event.metadata || '{}');
        totalMembersImported += metadata.imported || 0;
        totalDuplicates += metadata.duplicates || 0;
      } catch (error) {
        console.error('Error parsing event metadata:', error);
      }
    });
    
    const averageImportSize = successfulImports > 0 ? totalMembersImported / successfulImports : 0;
    const duplicateRate = totalMembersImported > 0 ? (totalDuplicates / totalMembersImported) * 100 : 0;
    const errorRate = totalImports > 0 ? (failedImports / totalImports) * 100 : 0;
    
    return {
      totalImports,
      successfulImports,
      failedImports,
      totalMembersImported,
      averageImportSize,
      duplicateRate,
      errorRate
    };
  } catch (error) {
    console.error('Failed to get import metrics:', error);
    return {
      totalImports: 0,
      successfulImports: 0,
      failedImports: 0,
      totalMembersImported: 0,
      averageImportSize: 0,
      duplicateRate: 0,
      errorRate: 0
    };
  }
}

async function checkAlerts(userId: string, config: AlertConfig = DEFAULT_ALERT_CONFIG): Promise<string[]> {
  const alerts: string[] = [];
  const metrics = await getImportMetrics(userId);
  
  // Check error rate
  if (metrics.errorRate > config.errorRateThreshold) {
    alerts.push(`High error rate: ${metrics.errorRate.toFixed(1)}% (threshold: ${config.errorRateThreshold}%)`);
  }
  
  // Check duplicate rate
  if (metrics.duplicateRate > config.duplicateRateThreshold) {
    alerts.push(`High duplicate rate: ${metrics.duplicateRate.toFixed(1)}% (threshold: ${config.duplicateRateThreshold}%)`);
  }
  
  // Check failure count
  if (metrics.failedImports >= config.failureCountThreshold) {
    alerts.push(`Multiple failures: ${metrics.failedImports} failed imports (threshold: ${config.failureCountThreshold})`);
  }
  
  return alerts;
}

async function logImportSuccess(userId: string, details: {
  imported: number;
  total_parsed: number;
  duplicates: number;
  batches_processed: number;
  batch_size: number;
  processing_time_ms: number;
}): Promise<void> {
  try {
    await supabaseAdmin
      .from('events')
      .insert({
        member_id: 0, // System event
        type: 'import_success',
        timestamp: new Date().toISOString(),
        metadata: JSON.stringify({
          user_id: userId,
          ...details
        })
      });
  } catch (error) {
    console.error('Failed to log import success:', error);
  }
}

async function logImportError(userId: string, error: string, details: any): Promise<void> {
  try {
    await supabaseAdmin
      .from('events')
      .insert({
        member_id: 0, // System event
        type: 'import_error',
        timestamp: new Date().toISOString(),
        metadata: JSON.stringify({
          user_id: userId,
          error,
          details
        })
      });
  } catch (logError) {
    console.error('Failed to log import error:', logError);
  }
}

async function getSystemHealth(): Promise<{
  status: 'healthy' | 'warning' | 'critical';
  metrics: ImportMetrics;
  alerts: string[];
}> {
  try {
    // Get system-wide metrics (last 24 hours)
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: successEvents } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('type', 'import_success')
      .gte('timestamp', since);
    
    const { data: errorEvents } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('type', 'import_error')
      .gte('timestamp', since);
    
    const totalImports = (successEvents?.length || 0) + (errorEvents?.length || 0);
    const errorRate = totalImports > 0 ? ((errorEvents?.length || 0) / totalImports) * 100 : 0;
    
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    const alerts: string[] = [];
    
    if (errorRate > 30) {
      status = 'critical';
      alerts.push(`Critical error rate: ${errorRate.toFixed(1)}%`);
    } else if (errorRate > 10) {
      status = 'warning';
      alerts.push(`Elevated error rate: ${errorRate.toFixed(1)}%`);
    }
    
    const metrics: ImportMetrics = {
      totalImports,
      successfulImports: successEvents?.length || 0,
      failedImports: errorEvents?.length || 0,
      totalMembersImported: 0, // Would need to calculate from metadata
      averageImportSize: 0,
      duplicateRate: 0,
      errorRate
    };
    
    return { status, metrics, alerts };
  } catch (error) {
    console.error('Failed to get system health:', error);
    return {
      status: 'critical',
      metrics: {
        totalImports: 0,
        successfulImports: 0,
        failedImports: 0,
        totalMembersImported: 0,
        averageImportSize: 0,
        duplicateRate: 0,
        errorRate: 100
      },
      alerts: ['Failed to retrieve system health metrics']
    };
  }
}

export { 
  getImportMetrics, 
  checkAlerts, 
  logImportSuccess, 
  logImportError, 
  getSystemHealth,
  type ImportMetrics,
  type AlertConfig
};
