import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { DatePickerInput } from '../../components/DatePickerInput';
import { MultiSelect } from '../../components/MultiSelect';
import { ProcessMetrics } from '../../components/ProcessMetrics';
import { ControlCharts } from '../../components/ControlCharts';
import { DistributionChart } from '../../components/DistributionChart';
import { HistogramChart } from '../../components/HistogramChart';
import { fetchShiftData, fetchMaterialList, fetchOperationList, fetchGuageList, fetchInspectionData } from '../../api/spcApi';
import { Search, Filter, Download } from 'lucide-react-native';
import '@babel/runtime/helpers/interopRequireDefault';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { format } from 'date-fns';

interface ShiftData {
  ShiftId: number;
  ShiftName: string;
}

interface MaterialData {
  MaterialCode: string;
  MaterialName: string;
}

interface OperationData {
  OperationCode: string;
  OperationName: string;
}

interface GuageData {
  GuageCode: string;
  GuageName: string;
}

interface InspectionData {
  ActualSpecification: string;
  FromSpecification: string;
  ToSpecification: string;
  ShiftCode: number;
  TrnDate: string;
}

interface Subgroup {
  mean: number;
  range: number;
  values: number[];
}

// SPC Constants for different sample sizes
const SPC_CONSTANTS = {
  1: { A2: 2.66, D3: 0, D4: 3.267, d2: 1.128 },
  2: { A2: 1.88, D3: 0, D4: 3.267, d2: 1.128 },
  3: { A2: 1.023, D3: 0, D4: 2.575, d2: 1.693 },
  4: { A2: 0.729, D3: 0, D4: 2.282, d2: 2.059 },
  5: { A2: 0.577, D3: 0, D4: 2.115, d2: 2.326 }
} as const;

export default function AnalysisScreen() {
  const [selectedShifts, setSelectedShifts] = useState<number[]>([]);
  const [material, setMaterial] = useState('');
  const [operation, setOperation] = useState('');
  const [gauge, setGauge] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [sampleSize, setSampleSize] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const [shifts, setShifts] = useState<ShiftData[]>([]);
  const [materials, setMaterials] = useState<MaterialData[]>([]);
  const [operations, setOperations] = useState<OperationData[]>([]);
  const [gauges, setGauges] = useState<GuageData[]>([]);

  const [analysisData, setAnalysisData] = useState<{
    metrics: any;
    controlCharts: {
      xBarData: any[];
      rangeData: any[];
      limits: any;
    };
    distribution: {
      data: any[];
      stats: any;
      numberOfBins: number;
    };
  } | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const shiftData = await fetchShiftData();
      setShifts(shiftData.data);
    } catch (error) {
      setError('Error loading shift data');
      console.error('Error loading initial data:', error);
    }
  };

  useEffect(() => {
    if (startDate && endDate && selectedShifts.length > 0) {
      loadMaterials();
    }
  }, [startDate, endDate, selectedShifts]);

  const loadMaterials = async () => {
    try {
      const materialData = await fetchMaterialList(startDate, endDate, selectedShifts);
      setMaterials(materialData);
    } catch (error) {
      setError('Error loading materials');
      console.error('Error loading materials:', error);
    }
  };

  useEffect(() => {
    if (material && selectedShifts.length > 0) {
      loadOperations();
    }
  }, [material, selectedShifts]);

  const loadOperations = async () => {
    try {
      const operationData = await fetchOperationList(startDate, endDate, material, selectedShifts);
      setOperations(operationData);
    } catch (error) {
      setError('Error loading operations');
      console.error('Error loading operations:', error);
    }
  };

  useEffect(() => {
    if (operation && selectedShifts.length > 0) {
      loadGauges();
    }
  }, [operation, selectedShifts]);

  const loadGauges = async () => {
    try {
      const gaugeData = await fetchGuageList(startDate, endDate, material, operation, selectedShifts);
      setGauges(gaugeData);
    } catch (error) {
      setError('Error loading gauges');
      console.error('Error loading gauges:', error);
    }
  };

  const calculateSubgroups = (data: InspectionData[], size: number): Subgroup[] => {
    const sortedData = data
      .map(d => ({
        ...d,
        value: parseFloat(d.ActualSpecification),
        date: new Date(d.TrnDate)
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    if (size === 1) {
      const values = sortedData.map(d => d.value);
      const movingRanges = values.slice(1).map((value, i) => Math.abs(value - values[i]));
      
      return values.map((value, i) => ({
        mean: value,
        range: i === 0 ? movingRanges[0] : movingRanges[i - 1],
        values: [value]
      }));
    }

    const subgroups: Subgroup[] = [];
    for (let i = 0; i < sortedData.length; i += size) {
      const subgroup = sortedData.slice(i, i + size);
      if (subgroup.length === size) {
        const values = subgroup.map(d => d.value);
        const subgroupRange = Math.max(...values) - Math.min(...values);
        subgroups.push({
          mean: values.reduce((a, b) => a + b, 0) / size,
          range: Math.max(subgroupRange, 0.0001),
          values
        });
      }
    }
    
    return subgroups;
  };

  const handleAnalyze = async () => {
    if (!selectedShifts.length || !material || !operation || !gauge) {
      setError('Please select all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const inspectionData = await fetchInspectionData(
        startDate,
        endDate,
        material,
        operation,
        gauge,
        selectedShifts
      );

      const filteredData = inspectionData.filter((data: { ShiftCode: number; }) => 
        selectedShifts.includes(data.ShiftCode)
      );

      if (filteredData.length === 0) {
        setError('No data available for the selected criteria');
        setLoading(false);
        return;
      }

      if (filteredData.length < sampleSize) {
        setError(`Not enough data points. Need at least ${sampleSize} points for sample size ${sampleSize}`);
        setLoading(false);
        return;
      }

      const subgroups = calculateSubgroups(filteredData, sampleSize);
      
      if (subgroups.length === 0) {
        setError('Not enough complete subgroups for analysis');
        setLoading(false);
        return;
      }

      const xBarData = subgroups.map((sg, i) => ({ x: i + 1, y: sg.mean }));
      const rangeData = subgroups.map((sg, i) => ({ x: i + 1, y: sg.range }));

      const mean = xBarData.reduce((a, b) => a + b.y, 0) / xBarData.length;

      const rangeMean = Math.max(
        sampleSize === 1
          ? rangeData.reduce((a, b) => a + b.y, 0) / rangeData.length
          : rangeData.reduce((a, b) => a + b.y, 0) / rangeData.length,
        0.0001
      );

      const constants = SPC_CONSTANTS[sampleSize as keyof typeof SPC_CONSTANTS];
      const { A2, D3, D4, d2 } = constants;

      const xBarUcl = sampleSize === 1
        ? mean + (2.66 * rangeMean)
        : mean + (A2 * rangeMean);

      const xBarLcl = sampleSize === 1
        ? mean - (2.66 * rangeMean)
        : mean - (A2 * rangeMean);

      const rangeUcl = D4 * rangeMean;
      const rangeLcl = D3 * rangeMean;

      const usl = parseFloat(filteredData[0].ToSpecification);
      const lsl = parseFloat(filteredData[0].FromSpecification);

      if (usl <= lsl) {
        setError('Invalid specification limits: USL must be greater than LSL');
        setLoading(false);
        return;
      }

      const stdDev = Math.max(rangeMean / d2, 0.0001);

      const calculateCapabilityIndex = (value: number) => {
        if (!isFinite(value) || Math.abs(value) > 1000) {
          return 999.999;
        }
        return value;
      };

      const cp = calculateCapabilityIndex((usl - lsl) / (6 * stdDev));
      const cpu = calculateCapabilityIndex((usl - mean) / (3 * stdDev));
      const cpl = calculateCapabilityIndex((mean - lsl) / (3 * stdDev));
      const cpk = Math.min(cpu, cpl);

      const allValues = subgroups.flatMap(sg => sg.values);
      const numberOfBins = Math.ceil(Math.sqrt(allValues.length));
      
      const min = Math.min(...allValues);
      const max = Math.max(...allValues);
      const binWidth = (max - min) / numberOfBins;
      
      const binCounts = new Array(numberOfBins).fill(0);
      allValues.forEach(value => {
        const binIndex = Math.min(
          Math.floor((value - min) / binWidth),
          numberOfBins - 1
        );
        binCounts[binIndex]++;
      });

      const distributionData = binCounts.map((count, i) => ({
        x: min + (i * binWidth) + (binWidth / 2),
        y: count
      }));

      setAnalysisData({
        metrics: {
          xBar: Number(mean.toFixed(4)),
          stdDevOverall: Number(stdDev.toFixed(4)),
          stdDevWithin: Number(stdDev.toFixed(4)),
          movingRange: Number(rangeMean.toFixed(4)),
          cp: Number(cp.toFixed(4)),
          cpkUpper: Number(cpu.toFixed(4)),
          cpkLower: Number(cpl.toFixed(4)),
          cpk: Number(cpk.toFixed(4)),
          pp: Number(cp.toFixed(4)),
          ppu: Number(cpu.toFixed(4)),
          ppl: Number(cpl.toFixed(4)),
          ppk: Number(cpk.toFixed(4)),
          lsl: Number(lsl.toFixed(4)),
          usl: Number(usl.toFixed(4))
        },
        controlCharts: {
          xBarData,
          rangeData,
          limits: {
            xBarUcl: Number(xBarUcl.toFixed(4)),
            xBarLcl: Number(xBarLcl.toFixed(4)),
            xBarMean: Number(mean.toFixed(4)),
            rangeUcl: Number(rangeUcl.toFixed(4)),
            rangeLcl: Number(rangeLcl.toFixed(4)),
            rangeMean: Number(rangeMean.toFixed(4))
          }
        },
        distribution: {
          data: distributionData,
          stats: {
            mean: Number(mean.toFixed(4)),
            stdDev: Number(stdDev.toFixed(4)),
            target: Number(((usl + lsl) / 2).toFixed(4))
          },
          numberOfBins
        }
      });
    } catch (error) {
      console.error('Error analyzing data:', error);
      setError('Error analyzing data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleShiftSelection = (values: (string | number)[]) => {
    setSelectedShifts(values.map(v => Number(v)));
  };

  const generateHTML = () => {
    if (!analysisData) return '';
  
    const { metrics, controlCharts, distribution } = analysisData;
  
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>SPC Analysis Report</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 20px;
              max-width: 1200px;
              margin: 0 auto;
              background: #f8fafc;
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px;
              padding: 20px;
              background: white;
              border-radius: 8px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .section { 
              margin-bottom: 30px;
              padding: 20px;
              background: white;
              border-radius: 8px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .metrics-grid { 
              display: grid; 
              grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
              gap: 20px;
              margin-bottom: 20px;
            }
            .metric-item { 
              padding: 15px;
              background: #f8fafc;
              border-radius: 8px;
              border: 1px solid #e2e8f0;
            }
            .metric-label { 
              font-weight: bold;
              color: #1e293b;
              margin-bottom: 8px;
            }
            .metric-value { 
              color: #0f172a;
              font-size: 1.1em;
            }
            .chart-container {
              margin: 20px 0;
              padding: 20px;
              background: white;
              border-radius: 8px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .parameters {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 15px;
              margin-bottom: 20px;
            }
            .parameter {
              background: #f8fafc;
              padding: 15px;
              border-radius: 6px;
              border: 1px solid #e2e8f0;
            }
            .interpretation {
              margin-top: 20px;
              padding: 20px;
              background: #f0f9ff;
              border-radius: 8px;
              border-left: 4px solid #0ea5e9;
            }
            .chart-title {
              font-size: 1.2em;
              font-weight: bold;
              color: #1e293b;
              margin-bottom: 15px;
            }
            .limits-container {
              display: flex;
              gap: 15px;
              margin-bottom: 15px;
            }
            .limit-box {
              flex: 1;
              padding: 10px;
              border-radius: 6px;
              text-align: center;
            }
            .ucl { background: #fee2e2; }
            .mean { background: #e0e7ff; }
            .lcl { background: #fee2e2; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Statistical Process Control Analysis Report</h1>
            <p>Generated on ${format(new Date(), 'PPP')}</p>
          </div>
  
          <div class="section">
            <h2>Analysis Parameters</h2>
            <div class="parameters">
              <div class="parameter">
                <strong>Date Range:</strong><br>
                ${format(startDate, 'PPP')} - ${format(endDate, 'PPP')}
              </div>
              <div class="parameter">
                <strong>Material:</strong><br>
                ${materials.find(m => m.MaterialCode === material)?.MaterialName || material}
              </div>
              <div class="parameter">
                <strong>Operation:</strong><br>
                ${operations.find(o => o.OperationCode === operation)?.OperationName || operation}
              </div>
              <div class="parameter">
                <strong>Gauge:</strong><br>
                ${gauges.find(g => g.GuageCode === gauge)?.GuageName || gauge}
              </div>
              <div class="parameter">
                <strong>Sample Size:</strong><br>
                ${sampleSize}
              </div>
            </div>
          </div>
  
          <div class="section">
            <h2>Process Metrics</h2>
            <div class="metrics-grid">
              <div class="metric-item">
                <div class="metric-label">X-Bar (Mean)</div>
                <div class="metric-value">${metrics.xBar}</div>
              </div>
              <div class="metric-item">
                <div class="metric-label">Standard Deviation (Overall)</div>
                <div class="metric-value">${metrics.stdDevOverall}</div>
              </div>
              <div class="metric-item">
                <div class="metric-label">Cp</div>
                <div class="metric-value">${metrics.cp}</div>
              </div>
              <div class="metric-item">
                <div class="metric-label">Cpk</div>
                <div class="metric-value">${metrics.cpk}</div>
              </div>
              <div class="metric-item">
                <div class="metric-label">Pp</div>
                <div class="metric-value">${metrics.pp}</div>
              </div>
              <div class="metric-item">
                <div class="metric-label">Ppk</div>
                <div class="metric-value">${metrics.ppk}</div>
              </div>
            </div>
          </div>
  
          <div class="section">
            <h2>Control Charts</h2>
            
            <div class="chart-container">
              <div class="chart-title">X-Bar Chart</div>
              <div class="limits-container">
                <div class="limit-box ucl">
                  <strong>UCL:</strong> ${controlCharts.limits.xBarUcl.toFixed(3)}
                </div>
                <div class="limit-box mean">
                  <strong>Mean:</strong> ${controlCharts.limits.xBarMean.toFixed(3)}
                </div>
                <div class="limit-box lcl">
                  <strong>LCL:</strong> ${controlCharts.limits.xBarLcl.toFixed(3)}
                </div>
              </div>
            </div>
  
            <div class="chart-container">
              <div class="chart-title">Range Chart</div>
              <div class="limits-container">
                <div class="limit-box ucl">
                  <strong>UCL:</strong> ${controlCharts.limits.rangeUcl.toFixed(3)}
                </div>
                <div class="limit-box mean">
                  <strong>Mean:</strong> ${controlCharts.limits.rangeMean.toFixed(3)}
                </div>
                <div class="limit-box lcl">
                  <strong>LCL:</strong> ${controlCharts.limits.rangeLcl.toFixed(3)}
                </div>
              </div>
            </div>
          </div>
  
          <div class="section">
            <h2>Process Interpretation</h2>
            <div class="interpretation">
              <p><strong>Short-term Capability (Cp):</strong> ${metrics.cp >= 1.33 ? 'Process is capable' : 'Process needs improvement'}</p>
              <p><strong>Short-term Centered (Cpk):</strong> ${metrics.cpk >= 1.33 ? 'Process is centered' : 'Process centering needs improvement'}</p>
              <p><strong>Long-term Performance (Pp):</strong> ${metrics.pp >= 1.33 ? 'Process is performing well' : 'Long-term performance needs improvement'}</p>
              <p><strong>Long-term Centered (Ppk):</strong> ${metrics.ppk >= 1.33 ? 'Process is stable' : 'Long-term stability needs improvement'}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const handleDownload = async () => {
    if (!analysisData) {
      setError('No analysis data available to download');
      return;
    }

    try {
      setDownloading(true);
      const html = generateHTML();
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false
      });

      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = uri;
        link.download = `spc-analysis-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
        link.click();
      } else {
        await Sharing.shareAsync(uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf'
        });
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      setError('Error generating PDF report');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>SPC Analysis</Text>
          <Text style={styles.subtitle}>Statistical Process Control</Text>
        </View>
        
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Filter size={20} color="#4B5563" />
            <Text style={styles.cardTitle}>Analysis Parameters</Text>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.sectionTitle}>Date Range</Text>
            <DatePickerInput
              label="Start Date"
              value={startDate}
              onChange={setStartDate}
            />
            <DatePickerInput
              label="End Date"
              value={endDate}
              onChange={setEndDate}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.sectionTitle}>Process Details</Text>
            
            <View style={styles.pickerContainer}>
              <Text style={styles.label}>Sample Size</Text>
              <Picker
                selectedValue={sampleSize}
                onValueChange={(value) => setSampleSize(Number(value))}
                style={styles.picker}
              >
                {[1, 2, 3, 4, 5].map((size) => (
                  <Picker.Item key={size} label={`${size}`} value={size} />
                ))}
              </Picker>
            </View>

            <MultiSelect
              label="Shifts"
              options={shifts.map(s => ({ value: s.ShiftId, label: s.ShiftName }))}
              selectedValues={selectedShifts}
              onSelectionChange={handleShiftSelection}
            />

            <View style={styles.pickerContainer}>
              <Text style={styles.label}>Material</Text>
              <Picker
                selectedValue={material}
                onValueChange={setMaterial}
                style={styles.picker}
              >
                <Picker.Item label="Select Material" value="" />
                {materials.map((m) => (
                  <Picker.Item 
                    key={m.MaterialCode} 
                    label={m.MaterialName} 
                    value={m.MaterialCode} 
                  />
                ))}
              </Picker>
            </View>

            <View style={styles.pickerContainer}>
              <Text style={styles.label}>Operation</Text>
              <Picker
                selectedValue={operation}
                onValueChange={setOperation}
                style={styles.picker}
                enabled={!!material}
              >
                <Picker.Item label="Select Operation" value="" />
                {operations.map((o) => (
                  <Picker.Item 
                    key={o.OperationCode} 
                    label={o.OperationName} 
                    value={o.OperationCode} 
                  />
                ))}
              </Picker>
            </View>

            <View style={styles.pickerContainer}>
              <Text style={styles.label}>Gauge</Text>
              <Picker
                selectedValue={gauge}
                onValueChange={setGauge}
                style={styles.picker}
                enabled={!!operation}
              >
                <Picker.Item label="Select Gauge" value="" />
                {gauges.map((g) => (
                  <Picker.Item 
                    key={g.GuageCode} 
                    label={g.GuageName} 
                    value={g.GuageCode} 
                  />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.analyzeButton,
                pressed && styles.buttonPressed,
                loading && styles.buttonDisabled
              ]}
              onPress={handleAnalyze}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Search size={20} color="#fff" />
                  <Text style={styles.buttonText}>Analyze Data</Text>
                </>
              )}
            </Pressable>

            {analysisData && (
              <Pressable
                style={({ pressed }) => [
                  styles.downloadButton,
                  pressed && styles.buttonPressed,
                  downloading && styles.buttonDisabled
                ]}
                onPress={handleDownload}
                disabled={downloading}
              >
                {downloading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Download size={20} color="#fff" />
                    <Text style={styles.buttonText}>Download Report</Text>
                  </>
                )}
              </Pressable>
            )}
          </View>
        </View>

        {analysisData && (
          <>
            <ProcessMetrics metrics={analysisData.metrics} />
            <ControlCharts 
              {...analysisData.controlCharts} 
              sampleSize={sampleSize}
            />
            <HistogramChart 
              data={analysisData.distribution.data}
              lsl={analysisData.metrics.lsl}
              usl={analysisData.metrics.usl}
              target={analysisData.distribution.stats.target}
              numberOfBins={analysisData.distribution.numberOfBins}
            />
            <DistributionChart
              {...analysisData.distribution}
            />
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  inputGroup: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  picker: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    height: 48,
  },
  buttonContainer: {
    gap: 12,
  },
  analyzeButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadButton: {
    backgroundColor: '#059669',
    borderRadius: 8,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
  },
});