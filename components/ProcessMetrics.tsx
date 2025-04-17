import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MetricCardProps {
  title: string;
  metrics: {
    label: string;
    value: string | number;
    color?: string;
  }[];
}

const MetricCard = ({ title, metrics }: MetricCardProps) => (
  <View style={styles.card}>
    <Text style={styles.cardTitle}>{title}</Text>
    {metrics.map((metric, index) => (
      <View key={index} style={styles.metricRow}>
        <Text style={styles.metricLabel}>{metric.label}</Text>
        <Text style={[styles.metricValue, metric.color && { color: metric.color }]}>
          {metric.value}
        </Text>
      </View>
    ))}
  </View>
);

interface ProcessMetricsProps {
  metrics: {
    xBar: number;
    stdDevOverall: number;
    stdDevWithin: number;
    movingRange: number;
    cp: number;
    cpkUpper: number;
    cpkLower: number;
    cpk: number;
    pp: number;
    ppu: number;
    ppl: number;
    ppk: number;
  };
}

export function ProcessMetrics({ metrics }: ProcessMetricsProps) {
  return (
    <View style={styles.container}>
      <MetricCard
        title="Process Location"
        metrics={[
          { label: 'X-Bar (Mean)', value: metrics.xBar.toFixed(4) }
        ]}
      />

      <MetricCard
        title="Variation Metrics"
        metrics={[
          { label: 'Standard Deviation (Overall)', value: metrics.stdDevOverall },
          { label: 'Standard Deviation (Within)', value: metrics.stdDevWithin },
          { label: 'Moving Range (R-bar)', value: metrics.movingRange }
        ]}
      />

      <MetricCard
        title="Process Capability (Short-term)"
        metrics={[
          { label: 'Cp', value: metrics.cp },
          { label: 'Cpk Upper', value: metrics.cpkUpper },
          { label: 'Cpk Lower', value: metrics.cpkLower },
          { label: 'Cpk', value: metrics.cpk }
        ]}
      />

      <MetricCard
        title="Process Performance (Long-term)"
        metrics={[
          { label: 'Pp', value: metrics.pp },
          { label: 'Ppu', value: metrics.ppu },
          { label: 'Ppl', value: metrics.ppl },
          { label: 'Ppk', value: metrics.ppk }
        ]}
      />

      <MetricCard
        title="3S Analysis"
        metrics={[
          { 
            label: 'Process Shift', 
            value: 'No',
            color: '#22C55E'
          },
          { 
            label: 'Process Spread', 
            value: 'No',
            color: '#22C55E'
          },
          { 
            label: 'Special Cause', 
            value: 'Special Cause Detected',
            color: '#EF4444'
          }
        ]}
      />

      <MetricCard
        title="Process Interpretation"
        metrics={[
          { 
            label: 'Short-term Capability (Cp)', 
            value: 'Process is more capable',
            color: '#22C55E'
          },
          { 
            label: 'Short-term Centered (Cpk)', 
            value: 'Process is more capable',
            color: '#22C55E'
          },
          { 
            label: 'Long-term Performance (Pp)', 
            value: 'Process is capable',
            color: '#3B82F6'
          },
          { 
            label: 'Long-term Centered (Ppk)', 
            value: 'Process is capable',
            color: '#3B82F6'
          }
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D4ED8',
    marginBottom: 12,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  metricLabel: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1D4ED8',
    textAlign: 'right',
  },
});