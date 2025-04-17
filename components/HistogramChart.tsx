import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { VictoryChart, VictoryBar, VictoryAxis, VictoryLine } from 'victory-native';

interface HistogramChartProps {
  data: {
    x: number;
    y: number;
  }[];
  lsl: number;
  usl: number;
  target: number;
  numberOfBins: number;
}

export function HistogramChart({ data, lsl, usl, target, numberOfBins }: HistogramChartProps) {
  // Calculate width based on number of bins
  const chartWidth = Math.max(350, numberOfBins * 50); // Minimum 350px or 50px per bin

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Histogram</Text>

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
              style={{ data: { fill: '#93C5FD' } }}
              barWidth={chartWidth / numberOfBins}
            />
            <VictoryLine
              x={() => lsl}
              style={{ 
                data: { 
                  stroke: '#EF4444', 
                  strokeWidth: 2,
                  strokeDasharray: '5,5'
                } 
              }}
            />
            <VictoryLine
              x={() => target}
              style={{ 
                data: { 
                  stroke: '#22C55E', 
                  strokeWidth: 2,
                  strokeDasharray: '5,5'
                } 
              }}
            />
            <VictoryLine
              x={() => usl}
              style={{ 
                data: { 
                  stroke: '#EF4444', 
                  strokeWidth: 2,
                  strokeDasharray: '5,5'
                } 
              }}
            />
          </VictoryChart>
        </View>
      </ScrollView>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#93C5FD' }]} />
          <Text style={styles.legendText}>Frequency</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#EF4444' }]} />
          <Text style={styles.legendText}>Specification Limits</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#22C55E' }]} />
          <Text style={styles.legendText}>Target</Text>
        </View>
      </View>

      <View style={styles.limits}>
        <View style={styles.limitItem}>
          <Text style={styles.limitLabel}>LSL</Text>
          <Text style={styles.limitValue}>{lsl.toFixed(3)}</Text>
        </View>
        <View style={styles.limitItem}>
          <Text style={styles.limitLabel}>Target</Text>
          <Text style={styles.limitValue}>{target.toFixed(3)}</Text>
        </View>
        <View style={styles.limitItem}>
          <Text style={styles.limitLabel}>USL</Text>
          <Text style={styles.limitValue}>{usl.toFixed(3)}</Text>
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
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
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
  limits: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 8,
  },
  limitItem: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  limitLabel: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 4,
  },
  limitValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
}); 