import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, TextInput } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Calendar } from 'lucide-react-native';
import { format } from 'date-fns';

interface DatePickerInputProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
}

export function DatePickerInput({ label, value, onChange }: DatePickerInputProps) {
  const [show, setShow] = useState(false);

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShow(Platform.OS === 'ios');
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  // For web, we'll use a specific handler
  const handleWebDateChange = (e: any) => {
    const selectedDate = new Date(e.target.value);
    if (!isNaN(selectedDate.getTime())) {
      onChange(selectedDate);
    }
  };

  if (Platform.OS === 'web') {
    // Web implementation using native HTML date input
    return (
      <View style={styles.container}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.inputContainer}>
          <input
            type="date"
            value={format(value, 'yyyy-MM-dd')}
            onChange={handleWebDateChange}
            style={{
              flex: 1,
              fontSize: 16,
              color: '#1F2937',
              border: 'none',
              outline: 'none',
              padding: 0,
              margin: 0,
              backgroundColor: 'transparent',
              fontFamily: 'inherit',
            }}
          />
          <Calendar size={20} color="#666" />
        </View>
      </View>
    );
  }

  // Native implementation for iOS/Android
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable 
        style={({ pressed }) => [
          styles.inputContainer,
          pressed && styles.pressed
        ]}
        onPress={() => setShow(true)}
      >
        <Text style={styles.dateText}>
          {format(value, 'dd/MM/yyyy')}
        </Text>
        <Calendar size={20} color="#666" />
      </Pressable>

      {show && (
        <DateTimePicker
          value={value}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
          style={styles.picker}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    height: 48,
  },
  pressed: {
    backgroundColor: '#F9FAFB',
  },
  dateText: {
    fontSize: 16,
    color: '#1F2937',
  },
  picker: {
    backgroundColor: '#fff',
  },
});



