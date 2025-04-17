import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { VictoryChart, VictoryBar, VictoryAxis, VictoryLine } from 'victory-native';

interface DistributionChartProps {
  data: {
    x: number;
    y: number;
  }[];
  stats: {
    mean: number;
    stdDev: number;
    target: number;
  };
  numberOfBins: number;
}

export function DistributionChart({ data, stats, numberOfBins }: DistributionChartProps) {
  // Calculate width based on number of data points
  const chartWidth = Math.max(350, data.length * 50); // Minimum 350px or 50px per point

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Distribution Analysis</Text>
        <Text style={styles.binsInfo}>Number of Bins: {numberOfBins} (√n rule)</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={[styles.statBox, styles.meanBox]}>
          <Text style={styles.statLabel}>Mean</Text>
          <Text style={styles.statValue}>{stats.mean}</Text>
        </View>
        <View style={[styles.statBox, styles.stdDevBox]}>
          <Text style={styles.statLabel}>Std Dev</Text>
          <Text style={styles.statValue}>{stats.stdDev}</Text>
        </View>
        <View style={[styles.statBox, styles.targetBox]}>
          <Text style={styles.statLabel}>Target</Text>
          <Text style={styles.statValue}>{stats.target}</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        <View style={{ width: chartWidth }}>
          <VictoryChart
            padding={{ top: 40, bottom: 50, left: 50, right: 20 }}
            height={300}
            width={chartWidth}
          >
            <VictoryAxis
              style={{
                grid: { stroke: '#E5E7EB', strokeDasharray: '5,5' },
              }}
            />
            <VictoryAxis
              dependentAxis
              label="Frequency"
              style={{
                grid: { stroke: '#E5E7EB', strokeDasharray: '5,5' },
                axisLabel: { padding: 35 },
              }}
            />
            <VictoryBar
              data={data}
              style={{ data: { fill: '#3B82F6' } }}
            />
            <VictoryLine
              x={() => stats.mean}
              style={{ data: { stroke: '#22C55E', strokeWidth: 2 } }}
            />
            <VictoryLine
              x={() => stats.target}
              style={{ data: { stroke: '#EF4444', strokeWidth: 2 } }}
            />
          </VictoryChart>
        </View>
      </ScrollView>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#3B82F6' }]} />
          <Text style={styles.legendText}>Frequency</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#22C55E' }]} />
          <Text style={styles.legendText}>Mean</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#EF4444' }]} />
          <Text style={styles.legendText}>Target</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  binsInfo: {
    fontSize: 14,
    color: '#6B7280',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  meanBox: {
    backgroundColor: '#DBEAFE',
  },
  stdDevBox: {
    backgroundColor: '#D1FAE5',
  },
  targetBox: {
    backgroundColor: '#FEF3C7',
  },
  statLabel: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#4B5563',
  },
});