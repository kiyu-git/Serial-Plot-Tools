void setup() {
  Serial.begin(9600);
}

void loop() {
  int analogA0 = analogRead(A0);
  int analogA1 = analogRead(A1);
  Serial.print("測定値A0:");
  Serial.print(analogA0);
  Serial.print(",");
  Serial.print("測定値A1:");
  Serial.print(analogA1);
  Serial.println();
  delay(100);
}
