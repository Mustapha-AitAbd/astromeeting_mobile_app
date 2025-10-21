"use client"

import { useRef, useState } from "react"
import { View, TextInput, StyleSheet } from "react-native"

export default function CodeInput({ length = 6, onComplete }) {
  const [code, setCode] = useState(Array(length).fill(""))
  const inputs = useRef([])

  const handleChange = (text, index) => {
    const newCode = [...code]
    newCode[index] = text
    setCode(newCode)

    // Auto-focus next input
    if (text && index < length - 1) {
      inputs.current[index + 1]?.focus()
    }

    // Check if code is complete
    if (newCode.every((digit) => digit !== "")) {
      onComplete?.(newCode.join(""))
    }
  }

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
  }

  return (
    <View style={styles.container}>
      {Array(length)
        .fill(0)
        .map((_, index) => (
          <TextInput
            key={index}
            ref={(ref) => (inputs.current[index] = ref)}
            style={styles.input}
            maxLength={1}
            keyboardType="number-pad"
            value={code[index]}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
          />
        ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 20,
  },
  input: {
    width: 50,
    height: 60,
    backgroundColor: "white",
    borderRadius: 12,
    fontSize: 28,
    fontWeight: "600",
    textAlign: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
})
