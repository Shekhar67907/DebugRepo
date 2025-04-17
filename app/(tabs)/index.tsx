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
      setError(null);
      const shiftData = await fetchShiftData();
      if (shiftData?.data) {
        setShifts(shiftData.data);
      } else {
        setError('Invalid shift data received');
      }
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
      setError(null);
      const materialData = await fetchMaterialList(startDate, endDate, selectedShifts);
      if (Array.isArray(materialData)) {
        setMaterials(materialData);
      } else {
        setError('Invalid material data received');
      }
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
      setError(null);
      const operationData = await fetchOperationList(startDate, endDate, material, selectedShifts);
      if (Array.isArray(operationData)) {
        setOperations(operationData);
      } else {
        setError('Invalid operation data received');
      }
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
      setError(null);
      const gaugeData = await fetchGuageList(startDate, endDate, material, operation, selectedShifts);
      if (Array.isArray(gaugeData)) {
        setGauges(gaugeData);
      } else {
        setError('Invalid gauge data received');
      }
    } catch (error) {
      setError('Error loading gauges');
      console.error('Error loading gauges:', error);
    }
  };

  const calculateSubgroups = (data: number[], size: number) => {
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }

    const subgroups = [];
    for (let i = 0; i < data.length; i += size) {
      const subgroup = data.slice(i, i + size);
      if (subgroup.length === size) {
        const validNumbers = subgroup.every(num => !isNaN(num));
        if (validNumbers) {
          subgroups.push({
            mean: subgroup.reduce((a, b) => a + b, 0) / size,
            range: Math.max(...subgroup) - Math.min(...subgroup)
          });
        }
      }
    }
    return subgroups;
  };

  const calculateDistributionData = (specifications: number[]) => {
    if (!Array.isArray(specifications) || specifications.length === 0) {
      return { data: [], numberOfBins: 0 };
    }

    const validSpecs = specifications.filter(spec => !isNaN(spec));
    if (validSpecs.length === 0) {
      return { data: [], numberOfBins: 0 };
    }

    const numberOfBins = Math.ceil(Math.sqrt(validSpecs.length));
    
    const min = Math.min(...validSpecs);
    const max = Math.max(...validSpecs);
    const binWidth = (max - min) / numberOfBins;
    
    const binCounts = new Array(numberOfBins).fill(0);
    validSpecs.forEach(spec => {
      const binIndex = Math.min(
        Math.floor((spec - min) / binWidth),
        numberOfBins - 1
      );
      binCounts[binIndex]++;
    });

    return {
      data: binCounts.map((count, i) => ({
        x: min + (i * binWidth) + (binWidth / 2),
        y: count
      })),
      numberOfBins
    };
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

      if (!Array.isArray(inspectionData) || inspectionData.length === 0) {
        setError('No data available for analysis');
        setLoading(false);
        return;
      }

      const filteredData = inspectionData.filter((data: { ShiftCode: number; }) => 
        selectedShifts.includes(data.ShiftCode)
      );

      if (filteredData.length === 0) {
        setError('No data available for selected shifts');
        setLoading(false);
        return;
      }

      const specifications = filteredData.map(d => parseFloat(d.ActualSpecification))
        .filter(spec => !isNaN(spec));

      if (specifications.length === 0) {
        setError('No valid specification data available');
        setLoading(false);
        return;
      }

      const subgroups = calculateSubgroups(specifications, sampleSize);
      
      const xBarData = subgroups.map((sg, i) => ({ x: i + 1, y: sg.mean }));
      const rangeData = subgroups.map((sg, i) => ({ x: i + 1, y: sg.range }));

      // Constants for different sample sizes
      const constants = {
        1: { A2: 1.880, D3: 0, D4: 3.267 },
        2: { A2: 1.023, D3: 0, D4: 3.267 },
        3: { A2: 0.729, D3: 0, D4: 2.575 },
        4: { A2: 0.577, D3: 0, D4: 2.282 },
        5: { A2: 0.483, D3: 0, D4: 2.115 }
      };

      const { A2, D3, D4 } = constants[sampleSize as keyof typeof constants] || constants[1];

      const mean = subgroups.reduce((a, b) => a + b.mean, 0) / subgroups.length;
      const rangeMean = subgroups.reduce((a, b) => a + b.range, 0) / subgroups.length;
      
      const xBarUcl = mean + (A2 * rangeMean);
      const xBarLcl = mean - (A2 * rangeMean);
      const rangeUcl = D4 * rangeMean;
      const rangeLcl = D3 * rangeMean;

      const usl = parseFloat(filteredData[0].ToSpecification);
      const lsl = parseFloat(filteredData[0].FromSpecification);
      
      if (isNaN(usl) || isNaN(lsl)) {
        setError('Invalid specification limits');
        setLoading(false);
        return;
      }

      const stdDev = rangeMean / (sampleSize === 1 ? 1.128 : Math.sqrt(sampleSize));
      const cp = (usl - lsl) / (6 * stdDev);
      const cpu = (usl - mean) / (3 * stdDev);
      const cpl = (mean - lsl) / (3 * stdDev);
      const cpk = Math.min(cpu, cpl);

      const distributionData = calculateDistributionData(specifications);

      const analysis = {
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
          data: distributionData.data,
          stats: {
            mean: Number(mean.toFixed(4)),
            stdDev: Number(stdDev.toFixed(4)),
            target: Number(((usl + lsl) / 2).toFixed(4))
          },
          numberOfBins: distributionData.numberOfBins
        }
      };

      setAnalysisData(analysis);
    } catch (error) {
      setError('Error analyzing data');
      console.error('Error analyzing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShiftSelection = (values: (string | number)[]) => {
    try {
      // Ensure values is an array and contains only numbers
      const numericValues = values
        .map(v => Number(v))
        .filter(v => !isNaN(v));
      
      setSelectedShifts(numericValues);
    } catch (error) {
      console.error('Error in shift selection:', error);
      setSelectedShifts([]);
      setError('Error selecting shifts');
    }
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