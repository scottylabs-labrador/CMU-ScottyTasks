// This component is not currently used (was created to refactor tasks.tsx picker fields)
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

interface PickerFieldProps {
  label: string;
  displayValue: string;
  isOpen: boolean;
  onOpen: () => void;
  tempValue: Date;
  setTempValue: (date: Date) => void;
  onDone: () => void;
  mode: "date" | "time";
  minuteInterval?: 1 | 2 | 3 | 4 | 5 | 6 | 10 | 12 | 15 | 20 | 30;
  minimumDate?: Date;
}

export default function PickerField({
  label,
  displayValue,
  isOpen,
  onOpen,
  tempValue,
  setTempValue,
  onDone,
  mode,
  minuteInterval,
  minimumDate,
}: PickerFieldProps) {
  return (
    <>
      <TouchableOpacity
        onPress={onOpen}
        style={[
          styles.pickerBtn,
          (isOpen || otherIsOpen) && {
            height: 0,
            padding: 0,
            overflow: "hidden",
            marginBottom: 0,
          },
        ]}
      >
        <Text>
          {label} {displayValue}
        </Text>
      </TouchableOpacity>

      <View
        style={
          isOpen ? { alignItems: "center" } : { height: 0, overflow: "hidden" }
        }
      >
        <DateTimePicker
          value={tempValue}
          mode={mode}
          display="spinner"
          minuteInterval={minuteInterval}
          minimumDate={minimumDate}
          onChange={(_event, val) => {
            if (val) setTempValue(val);
          }}
        />
        <TouchableOpacity onPress={onDone}>
          <Text
            style={{ color: "#C41230", textAlign: "center", fontWeight: "700" }}
          >
            Done
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  pickerBtn: {
    marginBottom: 10,
    padding: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
  },
  doneText: {
    color: "#C41230",
    textAlign: "center",
    fontWeight: "700",
  },
});
