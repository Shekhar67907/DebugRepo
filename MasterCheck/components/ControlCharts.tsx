import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { VictoryChart, VictoryLine, VictoryScatter, VictoryAxis, VictoryLabel } from 'victory-native';

interface ControlChartsProps {
  xBarData: { x: number; y: number }[];
  rangeData: { x: number; y: number }[];
  limits: {
    xBarUcl: number;
    xBarLcl: number;
    xBarMean: number;
    rangeUcl: number;
    rangeLcl: number;
    rangeMean: number;
  };
  sampleSize: number;
}

const constants = {
  1: { A2: 2.66, D3: 0, D4: 3.267, d2: 1.128 },
  2: { A2: 1.88, D3: 0, D4: 3.267, d2: 1.128 },
  3: { A2: 1.023, D3: 0, D4: 2.575, d2: 1.693 },
  4: { A2: 0.729, D3: 0, D4: 2.282, d2: 2.059 },
  5: { A2: 0.577, D3: 0, D4: 2.115, d2: 2.326 }
} as const;

export function ControlCharts({ xBarData, rangeData, limits, sampleSize }: ControlChartsProps) {
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = Math.max(screenWidth - 40, xBarData.length * 40);
  const { A2, D3, D4, d2 } = constants[sampleSize as keyof typeof constants] || constants[1];

  const commonAxisStyle = {
    axis: { stroke: '#374151', strokeWidth: 1 },
    grid: { stroke: '#E5E7EB', strokeDasharray: '4,4' },
    tickLabels: { 
      fontSize: 12,
      padding: 5,
      fill: '#374151',
      fontWeight: '400'
    },
    axisLabel: {
      fontSize: 14,
      padding: 35,
      fill: '#111827',
      fontWeight: '500'
    }
  };

  const renderChart = (
    data: typeof xBarData,
    limits: { ucl: number; lcl: number; mean: number },
    title: string,
    formula: string
  ) => {
    // Calculate domain with padding
    const yValues = [...data.map(d => d.y), limits.ucl, limits.lcl, limits.mean];
    const yMin = Math.min(...yValues);
    const yMax = Math.max(...yValues);
    const yPadding = (yMax - yMin) * 0.1;

    return (
      <View style={styles.chartWrapper}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>{title}</Text>
          <Text style={styles.formula}>{formula}</Text>
        </View>

        <View style={styles.limitsContainer}>
          <View style={[styles.limitBox, styles.uclBox]}>
            <Text style={styles.limitLabel}>UCL</Text>
            <Text style={styles.limitValue}>{limits.ucl.toFixed(3)}</Text>
          </View>
          <View style={[styles.limitBox, styles.meanBox]}>
            <Text style={styles.limitLabel}>{title === 'X-Bar Chart' ? 'X̄' : 'R̄'}</Text>
            <Text style={styles.limitValue}>{limits.mean.toFixed(3)}</Text>
          </View>
          <View style={[styles.limitBox, styles.lclBox]}>
            <Text style={styles.limitLabel}>LCL</Text>
            <Text style={styles.limitValue}>{limits.lcl.toFixed(3)}</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <VictoryChart
            width={chartWidth}
            height={300}
            padding={{ top: 40, bottom: 50, left: 60, right: 30 }}
            domain={{
              y: [yMin - yPadding, yMax + yPadding]
            }}
          >
            <VictoryAxis
  tickFormat={(t) => `G${t}`}  // Use backticks instead
  style={commonAxisStyle}
  label="Subgroups"
  axisLabelComponent={<VictoryLabel dy={35}/>}
/>
            <VictoryAxis
              dependentAxis
              style={commonAxisStyle}
              label={title === 'X-Bar Chart' ? 'Value' : 'Range'}
              axisLabelComponent={<VictoryLabel dy={-45}/>}
            />
            
            {/* Control Limits */}
            <VictoryLine
              y={() => limits.ucl}
              style={{ 
                data: { 
                  stroke: '#3B82F6', 
                  strokeWidth: 1.5,
                  strokeDasharray: '5,5' 
                } 
              }}
            />
            <VictoryLine
              y={() => limits.mean}
              style={{ 
                data: { 
                  stroke: '#10B981', 
                  strokeWidth: 1.5
                } 
              }}
            />
            <VictoryLine
              y={() => limits.lcl}
              style={{ 
                data: { 
                  stroke: '#3B82F6', 
                  strokeWidth: 1.5,
                  strokeDasharray: '5,5' 
                } 
              }}
            />

            {/* Data Line and Points */}
            <VictoryLine
              data={data}
              style={{ 
                data: { 
                  stroke: '#EF4444', 
                  strokeWidth: 2 
                } 
              }}
            />
            <VictoryScatter
              data={data}
              size={5}
              style={{ 
                data: { 
                  fill: '#EF4444',
                  stroke: '#fff',
                  strokeWidth: 1
                } 
              }}
            />
          </VictoryChart>
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.constantsTable}>
        <Text style={styles.tableTitle}>Control Chart Constants (n={sampleSize})</Text>
        <View style={styles.tableRow}>
          <View style={styles.tableCell}>
            <Text style={styles.tableCellLabel}>A2</Text>
            <Text style={styles.tableCellValue}>{A2}</Text>
          </View>
          <View style={styles.tableCell}>
            <Text style={styles.tableCellLabel}>D3</Text>
            <Text style={styles.tableCellValue}>{D3}</Text>
          </View>
          <View style={styles.tableCell}>
            <Text style={styles.tableCellLabel}>D4</Text>
            <Text style={styles.tableCellValue}>{D4}</Text>
          </View>
          <View style={styles.tableCell}>
            <Text style={styles.tableCellLabel}>d2</Text>
            <Text style={styles.tableCellValue}>{d2}</Text>
          </View>
        </View>
      </View>

      {renderChart(
        xBarData,
        {
          ucl: limits.xBarUcl,
          lcl: limits.xBarLcl,
          mean: limits.xBarMean
        },
        'X-Bar Chart',
        sampleSize === 1 
          ? 'UCL = X̄ + (2.66×MR/1.128), LCL = X̄ - (2.66×MR/1.128)'
          : 'UCL = X̄ + A2×R̄, LCL = X̄ - A2×R̄'
      )}

      {renderChart(
        rangeData,
        {
          ucl: limits.rangeUcl,
          lcl: limits.rangeLcl,
          mean: limits.rangeMean
        },
        'Range Chart',
        'UCL = D4×R̄, LCL = D3×R̄'
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  constantsTable: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tableTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tableCell: {
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    minWidth: 60,
  },
  tableCellLabel: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  tableCellValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  chartWrapper: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
  },
  chartHeader: {
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  formula: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'monospace',
  },
  limitsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  limitBox: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  uclBox: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  meanBox: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  lclBox: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  limitLabel: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
    fontWeight: '500',
  },
  limitValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
});