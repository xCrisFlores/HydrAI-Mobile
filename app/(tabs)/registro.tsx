import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Platform,
  Modal,
  View,
  Text,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/Colors';
import {  API_URL_LOCAL  } from '@/urls/urls';
import AnalisisConsumo from '@/components/ui/AIContainer';

import { MaterialIcons } from '@expo/vector-icons';
import { StatsContainer } from '@/components/ui/StatsContainer';
import { color } from '@rneui/themed/dist/config';


const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  backgroundGradientFrom: '#1e272e',
  backgroundGradientTo: '#1e272e',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '3',
    strokeWidth: '3',
    stroke: '#4caf50',
    fill: '#4caf50',
  },
  propsForLabels: {
    fontSize: 8,
  },
};

const barChartConfig = {
  ...chartConfig,
  barPercentage: 0.7,
  propsForLabels: {
    fontSize: 8,
  },
};

interface RegistroData {
  id: number;
  tiempoActivo: number;
  consumo: number;
  hora: number;
  personas: number;
  sensor: number;
  mes: number;
  dia: number;
  humedadProm: number;
  sensacionProm: number;
  temperaturaProm: number;
  usuario: number;
  fecha?: string;
}

type DayViewMode = 'month' | 'week' | 'range';

export default function TabThreeScreen() {
  const { token } = useAuth();
  const [registrosDia, setRegistrosDia] = useState<RegistroData[]>([]);
  const [registrosHora, setRegistrosHora] = useState<RegistroData[]>([]);
  const [loading, setLoading] = useState(false);
  const [dayViewMode, setDayViewMode] = useState<DayViewMode>('month');


  const [selectedHourDate, setSelectedHourDate] = useState<Date | null>(null);
  const [showHourPicker, setShowHourPicker] = useState(false);

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  
  const [showFilters, setShowFilters] = useState(false);


  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [tempMonth, setTempMonth] = useState<number>(new Date().getMonth());
  const [tempYear, setTempYear] = useState<number>(new Date().getFullYear());


  const [selectedWeekMonth, setSelectedWeekMonth] = useState<Date | null>(null);
  const [selectedWeekNumber, setSelectedWeekNumber] = useState<number>(1);
  const [showWeekMonthPicker, setShowWeekMonthPicker] = useState(false);
  const [tempWeekMonth, setTempWeekMonth] = useState<number>(new Date().getMonth());
  const [tempWeekYear, setTempWeekYear] = useState<number>(new Date().getFullYear());
  const [availableWeeks, setAvailableWeeks] = useState<Array<{number: number, start: Date, end: Date}>>([]);

  const [statsHora, setStatsHora] = useState<any>(null);
  const [statsDia, setStatsDia] = useState<any>(null);

  const [totalDia, setTotalDia] = useState<number>(0);
  const [totalHora, setTotalHora] = useState<number>(0);
  


  const API_BASE_URL = API_URL_LOCAL;

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];


  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - 0 + i);


  const toLocalDateString = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };


  const toApiDateString = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
  };

  const formatShortDate = (dateString: string) => {
    const parts = dateString.split('-');
    return `${parts[0]}/${parts[1]}`;
  };

const getWeeksInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    let weeks = [];
    let current = new Date(firstDayOfMonth);

  
    const day = current.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day; 
    current.setDate(current.getDate() + diffToMonday);

    let weekNumber = 1;
    while (current <= lastDayOfMonth) {
      const weekStart = new Date(current);
      const weekEnd = new Date(current);
      weekEnd.setDate(weekEnd.getDate() + 6);

      weeks.push({
        number: weekNumber,
        start: new Date(weekStart),
        end: new Date(weekEnd),
      });

      weekNumber++;
      current.setDate(current.getDate() + 7);
    }

    return weeks;
  };

  const fetchRegistrosDiaRango = async (start: Date, end: Date) => {
    if (!token) return;
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/registrosFecha/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          fechaInicio: toApiDateString(start), 
          fechaFin: toApiDateString(end) 
        }),
      });
      if (!response.ok) throw new Error('Error al obtener registrosDia rango');
      const json = await response.json();

      const formattedData = json.data.map((registro: RegistroData) => ({
        ...registro,
        fecha: registro.fecha ? toLocalDateString(new Date(registro.fecha)) : undefined
      }));
      
      setRegistrosDia(formattedData);
      setStatsDia(json.stats || {});
      setTotalDia(json.stats.total);
    } catch (error) {
      console.log(error);
      
    } finally {
      setLoading(false);
    }
  };


  const fetchRegistrosHora = async (date: Date) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/registrosHora/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fecha: toApiDateString(date) }),
      });
      if (!response.ok) throw new Error('Error al obtener registrosHora');
      
      const json = await response.json();
      setRegistrosHora(json.data || []);
      setStatsHora(json.stats || {});
      setTotalHora(json.stats.total);
    } catch (error) {
     console.log(error);
     
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const today = new Date();
    setSelectedHourDate(today);
    setSelectedMonth(today);
    setSelectedWeekMonth(today);
    
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    fetchRegistrosDiaRango(monthStart, monthEnd);
    fetchRegistrosHora(today);
  }, [token]);

  
  useEffect(() => {
    if (dayViewMode === 'range' && startDate && endDate) {
      fetchRegistrosDiaRango(startDate, endDate);
    } else if (dayViewMode === 'month' && selectedMonth) {
      const monthStart = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
      const monthEnd = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
      fetchRegistrosDiaRango(monthStart, monthEnd);
    } else if (dayViewMode === 'week' && selectedWeekMonth && selectedWeekNumber) {
      const weeks = getWeeksInMonth(selectedWeekMonth);
      const selectedWeek = weeks.find(w => w.number === selectedWeekNumber);
      if (selectedWeek) {
        fetchRegistrosDiaRango(selectedWeek.start, selectedWeek.end);
      }
    }
  }, [dayViewMode, startDate, endDate, selectedMonth, selectedWeekMonth, selectedWeekNumber, token]);

  
  useEffect(() => {
    if (selectedHourDate) fetchRegistrosHora(selectedHourDate);
  }, [selectedHourDate, token]);

 
  useEffect(() => {
    if (selectedWeekMonth) {
      const weeks = getWeeksInMonth(selectedWeekMonth);
      setAvailableWeeks(weeks);
      if (weeks.length > 0 && !weeks.find(w => w.number === selectedWeekNumber)) {
        setSelectedWeekNumber(weeks[0].number);
      }
    }
  }, [selectedWeekMonth]);

  const formatDate = (date: Date) => toLocalDateString(date);

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  };

  const prepareBarChartData = (data: RegistroData[]) => ({
    labels: data.map(d => formatShortDate(d.fecha || '')),
    datasets: [{ data: data.map(d => Math.round(d.consumo * 100) / 100) }],
  });

  const prepareLineChartData = (data: RegistroData[]) => ({
    labels: data.map(d => `${d.hora}`),
    datasets: [{ data: data.map(d => Math.round(d.consumo * 100) / 100) }],
  });

  const renderMonthPicker = () => (
    <Modal visible={showMonthPicker} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerTitle}>Seleccionar Mes</Text>
          <View style={styles.pickerRow}>
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>Mes</Text>
              <Picker
                selectedValue={tempMonth}
                onValueChange={setTempMonth}
                style={styles.picker}
              >
                {months.map((month, index) => (
                  <Picker.Item key={index} label={month} value={index} />
                ))}
              </Picker>
            </View>
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>Año</Text>
              <Picker
                selectedValue={tempYear}
                onValueChange={setTempYear}
                style={styles.picker}
              >
                {years.map((year) => (
                  <Picker.Item key={year} label={year.toString()} value={year} />
                ))}
              </Picker>
            </View>
          </View>
          <View style={styles.pickerButtons}>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowMonthPicker(false)}
            >
            <Text style={{color: "white"}}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pickerButton]}
              onPress={() => {
                setSelectedMonth(new Date(tempYear, tempMonth, 1));
                setShowMonthPicker(false);
              }}
            >
            <Text style={{color: "white"}}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderWeekMonthPicker = () => (
    <Modal visible={showWeekMonthPicker} animationType="slide" transparent>
      <View style={styles.modalContainer}>
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerTitle}>Seleccionar Mes para Semana</Text>
          <View style={styles.pickerRow}>
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>Mes</Text>
              <Picker
                selectedValue={tempWeekMonth}
                onValueChange={setTempWeekMonth}
                style={styles.picker}
              >
                {months.map((month, index) => (
                  <Picker.Item key={index} label={month} value={index} style={styles.pickerItem}/>
                ))}
              </Picker>
            </View>
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>Año</Text>
              <Picker
                selectedValue={tempWeekYear}
                onValueChange={setTempWeekYear}
                style={styles.picker}
              >
                {years.map((year) => (
                  <Picker.Item key={year} label={year.toString()} value={year} style={styles.pickerItem}/>
                ))}
              </Picker>
            </View>
          </View>
          <View style={styles.pickerButtons}>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowWeekMonthPicker(false)}
            >
            <Text style={{color: "white"}}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pickerButton]}
              onPress={() => {
                setSelectedWeekMonth(new Date(tempWeekYear, tempWeekMonth, 1));
                setShowWeekMonthPicker(false);
              }}
            >
             <Text style={{color: "white"}}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderDayModeButtons = () => (
    <ThemedView style={styles.modeButtonsContainer}>
      <TouchableOpacity
        style={[styles.modeButton, dayViewMode === 'range' && styles.modeButtonActive]}
        onPress={() => setDayViewMode('range')}
      >
        <ThemedText style={[styles.modeButtonText, dayViewMode === 'range' && styles.modeButtonTextActive]}>
          Rango
        </ThemedText>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.modeButton, dayViewMode === 'month' && styles.modeButtonActive]}
        onPress={() => setDayViewMode('month')}
      >
        <ThemedText style={[styles.modeButtonText, dayViewMode === 'month' && styles.modeButtonTextActive]}>
          Mes
        </ThemedText>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.modeButton, dayViewMode === 'week' && styles.modeButtonActive]}
        onPress={() => setDayViewMode('week')}
      >
        <ThemedText style={[styles.modeButtonText, dayViewMode === 'week' && styles.modeButtonTextActive]}>
          Semana
        </ThemedText>
      </TouchableOpacity>
      
    </ThemedView>
  );

  const renderDayControls = () => {
    switch (dayViewMode) {
      case 'range':
        return (
          <ThemedView style={styles.sectionContainer}>
            <ThemedText style={styles.sectionTitle}>Rango de Fechas</ThemedText>
            <ThemedView style={styles.dateButtonsRow}>
              <TouchableOpacity onPress={() => setShowStartPicker(true)} style={styles.dateButton}>
                <ThemedText style={styles.dateButtonText}>
                  {startDate ? formatDate(startDate) : 'Seleccionar inicio'}
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowEndPicker(true)} style={styles.dateButton}>
                <ThemedText style={styles.dateButtonText}>
                  {endDate ? formatDate(endDate) : 'Seleccionar fin'}
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        );
      case 'month':
        return (
          <ThemedView style={styles.sectionContainer}>
            <ThemedText style={styles.sectionTitle}>Seleccionar Mes</ThemedText>
            <TouchableOpacity 
              onPress={() => {
                setTempMonth(selectedMonth?.getMonth() || new Date().getMonth());
                setTempYear(selectedMonth?.getFullYear() || new Date().getFullYear());
                setShowMonthPicker(true);
              }} 
              style={styles.dateButton}
            >
              <ThemedText style={styles.dateButtonText}>
                {selectedMonth ? formatMonth(selectedMonth) : 'Seleccionar mes'}
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        );
      case 'week':
        return (
          <ThemedView style={styles.sectionContainer}>
            <ThemedText style={styles.sectionTitle}>Seleccionar Semana</ThemedText>
            <TouchableOpacity 
              onPress={() => {
                setTempWeekMonth(selectedWeekMonth?.getMonth() || new Date().getMonth());
                setTempWeekYear(selectedWeekMonth?.getFullYear() || new Date().getFullYear());
                setShowWeekMonthPicker(true);
              }} 
              style={styles.dateButton}
            >
              <ThemedText style={styles.dateButtonText}>
                {selectedWeekMonth ? formatMonth(selectedWeekMonth) : 'Seleccionar mes'}
              </ThemedText>
            </TouchableOpacity>
            {availableWeeks.length > 0 && (
              <ThemedView style={styles.weekButtonsContainer}>
                {availableWeeks.map((week) => (
                  <TouchableOpacity
                    key={week.number}
                    style={[
                      styles.weekButton,
                      selectedWeekNumber === week.number && styles.weekButtonActive
                    ]}
                    onPress={() => setSelectedWeekNumber(week.number)}
                  >
                    <ThemedText style={[
                      styles.weekButtonText,
                      selectedWeekNumber === week.number && styles.weekButtonTextActive
                    ]}>
                      Semana {week.number}
                    </ThemedText>
                    <ThemedText style={[
                      styles.weekButtonSubtext,
                      selectedWeekNumber === week.number && styles.weekButtonTextActive
                    ]}>
                      {formatDate(week.start)} - {formatDate(week.end)}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </ThemedView>
            )}
          </ThemedView>
        );
      default:
        return null;
    }
  };

  return (
   <ParallaxScrollView
      headerBackgroundColor={{ light: Colors.dark.headerSecondary, dark: Colors.dark.headerSecondary }}
      headerImage={<IconSymbol size={310} name="chart2" style={styles.headerImage} />}
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title" style={{ color: 'white' }}>Consumo Historico</ThemedText>
      </ThemedView>
      <View>
       
        <TouchableOpacity onPress={() => setShowFilters(!showFilters)} style={styles.menuButton}>
          <MaterialIcons name="menu" size={28} color="white" />
        </TouchableOpacity>

       
        {showFilters && (
          <>
            <ThemedView style={styles.sectionContainer}>
              <ThemedText style={styles.sectionTitle}>Registros por Días - Seleccionar Filtro</ThemedText>
              {renderDayModeButtons()}
              {renderDayControls()}
            </ThemedView>

            <ThemedView style={styles.dateControlsContainer}>
              <ThemedView style={styles.sectionContainer}>
                <ThemedText style={styles.sectionTitle}>Registros por Horas - Seleccionar Día</ThemedText>
                <TouchableOpacity onPress={() => setShowHourPicker(true)} style={styles.dateButton}>
                  <ThemedText style={styles.dateButtonText}>
                    {selectedHourDate ? formatDate(selectedHourDate) : 'Seleccionar día'}
                  </ThemedText>
                </TouchableOpacity>
              </ThemedView>
            </ThemedView>
          </>
        )}

       
        {showStartPicker && (
          <DateTimePicker
            value={startDate || new Date()}
            mode="date"
            display="default"
            onChange={(e, d) => {
              setShowStartPicker(false);
              if (d) setStartDate(d);
            }}
          />
        )}
        {showEndPicker && (
          <DateTimePicker
            value={endDate || new Date()}
            mode="date"
            display="default"
            onChange={(e, d) => {
              setShowEndPicker(false);
              if (d) setEndDate(d);
            }}
          />
        )}
        {showHourPicker && (
          <DateTimePicker
            value={selectedHourDate || new Date()}
            mode="date"
            display="default"
            onChange={(e, d) => {
              setShowHourPicker(false);
              if (d) setSelectedHourDate(d);
            }}
          />
        )}

      
        <ThemedView style={styles.dateControlsContainer}>
          {statsDia && <StatsContainer stats={statsDia} rango="dia" />}
          {statsHora && <StatsContainer stats={statsHora} rango="hora" />}

          {registrosHora.length > 0 && (
            <AnalisisConsumo registros={registrosHora} rango="hora" titulo='Estimaciones por hora' total={totalHora}/>
          )}
          {registrosDia.length > 0 && (
            <AnalisisConsumo registros={registrosDia} rango="dia" titulo='Estimaciones por dia' total={totalDia}/>
          )}
        </ThemedView>
      </View>

     {registrosDia.length > 0 && (
      <ThemedView style={styles.chartContainer}>
       <ThemedText style={styles.sectionTitle}>Consumo por dia</ThemedText>
        {registrosDia.length > 7 ? (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={true}
            style={styles.horizontalScrollContainer}
            contentContainerStyle={styles.scrollContent}
          >

  
            <BarChart
              data={prepareBarChartData(registrosDia)}
              width={Math.max(screenWidth * 0.9, registrosDia.length * 50)} 
              height={280}
              chartConfig={barChartConfig}
              style={styles.chart}
              fromZero
              showValuesOnTopOfBars
              verticalLabelRotation={90}
            />
          </ScrollView>
        ) : (
          <View>
          <BarChart
            data={prepareBarChartData(registrosDia)}
            width={screenWidth * 0.9}
            height={280}
            chartConfig={barChartConfig}
            style={styles.chart}
            fromZero
            showValuesOnTopOfBars
            verticalLabelRotation={90}
          /></View>
        )}
      </ThemedView>
    )}

    
      {registrosHora.length > 0 && (
        <ThemedView style={styles.chartContainer}>
          
          <ThemedText style={styles.sectionTitle}>Consumo por hora</ThemedText>
          <LineChart
            data={prepareLineChartData(registrosHora)}
            width={screenWidth * 0.9}
            height={280}
            chartConfig={chartConfig}
            style={styles.chart}
            bezier
            
          />
        </ThemedView>
      )}

      {loading && (
         <View>
          <ThemedText style={styles.sectionTitle}>Consumo por hora</ThemedText>
          <ThemedView style={styles.loadingContainer}>
            <ThemedText style={{ color: 'white' }}>Cargando datos...</ThemedText>
          </ThemedView>
        </View>
      )}

      {renderMonthPicker()}
      {renderWeekMonthPicker()}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#1e1e1e', 
  },
  menuButton: {
    padding: 8,
    marginRight: 12,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
   horizontalScrollContainer: {
      width: screenWidth * 0.9,
    },
    scrollContent: {
      alignItems: 'center',
      paddingHorizontal: 10,
    },
  headerImage: {
    color: Colors.dark.secondaryColor,
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modeButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  modeButton: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor:Colors.dark.secondaryColor,
  },
  modeButtonText: {
    color: '#ccc',
    fontSize: 12,
    fontWeight: '600',
  },
  modeButtonTextActive: {
    color: 'white',
  },
  dateControlsContainer: {
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  sectionContainer: {
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: 'white',
  },
  dateButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  dateButton: {
    backgroundColor: Colors.dark.secondaryColor,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  dateButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  weekButtonsContainer: {
    marginTop: 10,
    gap: 8,
  },
  weekButton: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  weekButtonActive: {
    backgroundColor: Colors.dark.secondaryColor,
  },
  weekButtonText: {
    color: '#ccc',
    fontSize: 12,
    fontWeight: '600',
  },
  weekButtonTextActive: {
    color: 'white',
  },
  weekButtonSubtext: {
    color: '#999',
    fontSize: 10,
    marginTop: 2,
  },
  statsContainer: {
    marginVertical: 15,
    alignItems: 'center',
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  chart: {
    borderRadius: 16,
    marginVertical: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  valueLabel: {
    position: 'absolute',
    backgroundColor: Colors.dark.secondaryColor,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignItems: 'center',
    minWidth: 30,
  },
  valueLabelText: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pickerItem: {
   
    color: "black",
  },
  pickerContainer: {
    backgroundColor: Colors.dark.blackSecondary,
    color: "white",
    borderRadius: 10,
    padding: 20,
    width: '85%',
    maxWidth: 400,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: 'white',
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  pickerColumn: {
    flex: 1,
    marginHorizontal: 5,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#white',
    marginBottom: 5,
    textAlign: 'center',
  },
  picker: {
    height: 50,
    backgroundColor: Colors.dark.primaryColor,
    color: "white",
    borderRadius: 8,
  },
  pickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  pickerButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: Colors.dark.secondaryColor,
    color: '#f0f0f0',
    alignItems: 'center',
  },
})