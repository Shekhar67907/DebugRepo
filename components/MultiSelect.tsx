import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Check } from 'lucide-react-native';

interface Option {
  value: string | number;
  label: string;
}

interface MultiSelectProps {
  label: string;
  options: Option[];
  selectedValues: (string | number)[];
  onSelectionChange: (values: (string | number)[]) => void;
}

export function MultiSelect({ label, options, selectedValues, onSelectionChange }: MultiSelectProps) {
  const toggleOption = (value: string | number) => {
    if (selectedValues.includes(value)) {
      onSelectionChange(selectedValues.filter(v => v !== value));
    } else {
      onSelectionChange([...selectedValues, value]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView 
        style={styles.optionsContainer}
        contentContainerStyle={styles.optionsContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {options.map((option, index) => (
          <Pressable
            key={`${option.value}-${index}`}
            style={({ pressed }) => [
              styles.option,
              selectedValues.includes(option.value) && styles.optionSelected,
              pressed && styles.optionPressed,
              index === options.length - 1 && styles.lastOption,
            ]}
            onPress={() => toggleOption(option.value)}
            android_ripple={{ color: 'rgba(0, 0, 0, 0.1)' }}
          >
            <Text style={[
              styles.optionText,
              selectedValues.includes(option.value) && styles.optionTextSelected
            ]}>
              {option.label}
            </Text>
            {selectedValues.includes(option.value) && (
              <Check size={16} color="#fff" strokeWidth={2.5} />
            )}
          </Pressable>
        ))}
      </ScrollView>
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
  optionsContainer: {
    maxHeight: 120,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionsContent: {
    padding: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 6,
    marginBottom: 4,
    backgroundColor: '#F9FAFB',
  },
  lastOption: {
    marginBottom: 0,
  },
  optionSelected: {
    backgroundColor: '#2563EB',
  },
  optionPressed: {
    opacity: 0.8,
  },
  optionText: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
  },
  optionTextSelected: {
    color: '#fff',
  },
});