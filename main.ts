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
})
