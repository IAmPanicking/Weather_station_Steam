let gas = 0
let press = 0
let hum = 0
let temp = 0
BME688.setAddress()
basic.forever(function () {
    // 1. Atliekamas BME688 matavimas
    BME688.measure()
    // 2. Reikšmės paimamos iš BME688
    temp = BME688.temperature()
    hum = BME688.humidity()
    press = BME688.pressure()
    gas = BME688.gasResistance()
    // 3. Patikrinimui siunčiame į Data Device
    serial.writeValue("Temperature", temp)
    serial.writeValue("Humidity", hum)
    serial.writeValue("Pressure", press)
    serial.writeValue("Gas", gas)
    // 4. Tas pačias reikšmes įrašome į Data Logger
    datalogger.log(
    datalogger.createCV("Temperature", temp),
    datalogger.createCV("Humidity", hum),
    datalogger.createCV("Pressure", press),
    datalogger.createCV("Gas", gas)
    )
    // 5. Naujas matavimas kas 2 sekundes
    basic.pause(2000)
})
