//% weight=100 color=#7B1FA2 icon="\uf2c9" block="BME688"
namespace BME688 {

    let address = 0x76
    let initialized = false

    // Temperature calibration
    let parT1 = 0
    let parT2 = 0
    let parT3 = 0

    // Humidity calibration
    let parH1 = 0
    let parH2 = 0
    let parH3 = 0
    let parH4 = 0
    let parH5 = 0
    let parH6 = 0
    let parH7 = 0

    // Pressure calibration
    let parP1 = 0
    let parP2 = 0
    let parP3 = 0
    let parP4 = 0
    let parP5 = 0
    let parP6 = 0
    let parP7 = 0
    let parP8 = 0
    let parP9 = 0
    let parP10 = 0

    // Measured values
    let temperatureValue = 0
    let humidityValue = 0
    let pressureValue = 0
    let gasResistanceValue = 0

    let tFine = 0


    // =========================================
    // I2C
    // =========================================

    function writeRegister(reg: number, value: number): void {
        let buf = pins.createBuffer(2)
        buf[0] = reg
        buf[1] = value
        pins.i2cWriteBuffer(address, buf)
    }


    function readRegister(reg: number): number {

        pins.i2cWriteNumber(
            address,
            reg,
            NumberFormat.UInt8BE,
            true
        )

        return pins.i2cReadNumber(
            address,
            NumberFormat.UInt8BE,
            false
        )
    }


    // =========================================
    // SIGNED VALUES
    // =========================================

    function signed8(value: number): number {

        if (value > 127) {
            return value - 256
        }

        return value
    }


    function signed16(value: number): number {

        if (value > 32767) {
            return value - 65536
        }

        return value
    }


    // =========================================
    // INITIALIZATION
    // =========================================

    function initialize(): void {

        if (initialized) {
            return
        }

        // Soft reset
        writeRegister(0xE0, 0xB6)
        basic.pause(20)


        // =====================================
        // TEMPERATURE CALIBRATION
        // =====================================

        let t2LSB = readRegister(0x8A)
        let t2MSB = readRegister(0x8B)

        parT2 =
            signed16(
                (t2MSB << 8) |
                t2LSB
            )

        parT3 =
            signed8(
                readRegister(0x8C)
            )

        let t1LSB = readRegister(0xE9)
        let t1MSB = readRegister(0xEA)

        parT1 =
            (t1MSB << 8) |
            t1LSB


        // =====================================
        // HUMIDITY CALIBRATION
        // =====================================

        let e1 = readRegister(0xE1)
        let e2 = readRegister(0xE2)
        let e3 = readRegister(0xE3)

        parH2 =
            (e1 << 4) |
            (e2 >> 4)

        parH1 =
            (e3 << 4) |
            (e2 & 0x0F)

        parH3 =
            signed8(
                readRegister(0xE4)
            )

        parH4 =
            signed8(
                readRegister(0xE5)
            )

        parH5 =
            signed8(
                readRegister(0xE6)
            )

        parH6 =
            readRegister(0xE7)

        parH7 =
            signed8(
                readRegister(0xE8)
            )


        // =====================================
        // PRESSURE CALIBRATION
        // =====================================

        parP1 =
            (readRegister(0x8F) << 8) |
            readRegister(0x8E)

        parP2 =
            signed16(
                (readRegister(0x91) << 8) |
                readRegister(0x90)
            )

        parP3 =
            signed8(
                readRegister(0x92)
            )

        parP4 =
            signed16(
                (readRegister(0x95) << 8) |
                readRegister(0x94)
            )

        parP5 =
            signed16(
                (readRegister(0x97) << 8) |
                readRegister(0x96)
            )

        parP7 =
            signed8(
                readRegister(0x98)
            )

        parP6 =
            signed8(
                readRegister(0x99)
            )

        parP8 =
            signed16(
                (readRegister(0x9D) << 8) |
                readRegister(0x9C)
            )

        parP9 =
            signed16(
                (readRegister(0x9F) << 8) |
                readRegister(0x9E)
            )

        parP10 =
            readRegister(0xA0)

        initialized = true
    }


    // =========================================
    // SET ADDRESS
    // =========================================

    //% block="set address 0x76"
    //% weight=100
    export function setAddress(): void {

        address = 0x76
        initialized = false
    }


    // =========================================
    // MEASURE
    // =========================================

    //% block="measure"
    //% weight=90
    export function measure(): void {

        initialize()


        // Humidity oversampling x2
        writeRegister(
            0x72,
            0x02
        )


        // =====================================
        // GAS HEATER
        // =====================================

        // Heater resistance
        writeRegister(
            0x5A,
            0x73
        )

        // Heater duration
        writeRegister(
            0x64,
            0x59
        )

        // Enable gas measurement
        writeRegister(
            0x71,
            0x20
        )


        // =====================================
        // TEMPERATURE + PRESSURE
        // =====================================

        // Temperature x2
        // Pressure x4
        // Forced mode
        writeRegister(
            0x74,
            0x49
        )

        basic.pause(200)


        // =====================================
        // TEMPERATURE
        // =====================================

        let tempMSB = readRegister(0x22)
        let tempLSB = readRegister(0x23)
        let tempXLSB = readRegister(0x24)

        let adcTemperature =
            (tempMSB << 12) |
            (tempLSB << 4) |
            (tempXLSB >> 4)


        let var1 =
            (
                adcTemperature / 16384.0 -
                parT1 / 1024.0
            ) *
            parT2


        let tempPart =
            adcTemperature / 131072.0 -
            parT1 / 8192.0


        let var2 =
            tempPart *
            tempPart *
            (
                parT3 * 16.0
            )


        tFine =
            var1 + var2


        temperatureValue =
            tFine / 5120.0


        // =====================================
        // HUMIDITY
        // =====================================

        let humMSB = readRegister(0x25)
        let humLSB = readRegister(0x26)

        let adcHumidity =
            (humMSB << 8) |
            humLSB


        let humVar1 =
            adcHumidity -
            (
                parH1 * 16.0 +
                parH3 / 2.0 *
                temperatureValue
            )


        let humVar2 =
            humVar1 *
            (
                parH2 / 262144.0 *
                (
                    1.0 +
                    parH4 / 16384.0 *
                    temperatureValue +
                    parH5 / 1048576.0 *
                    temperatureValue *
                    temperatureValue
                )
            )


        let humVar3 =
            parH6 /
            16384.0


        let humVar4 =
            parH7 /
            2097152.0


        humidityValue =
            humVar2 +
            (
                (
                    humVar3 +
                    humVar4 *
                    temperatureValue
                ) *
                humVar2 *
                humVar2
            )


        if (humidityValue > 100) {
            humidityValue = 100
        }

        if (humidityValue < 0) {
            humidityValue = 0
        }


        // =====================================
        // PRESSURE
        // =====================================

        let pressMSB = readRegister(0x1F)
        let pressLSB = readRegister(0x20)
        let pressXLSB = readRegister(0x21)

        let adcPressure =
            (pressMSB << 12) |
            (pressLSB << 4) |
            (pressXLSB >> 4)


        let pVar1 =
            tFine / 2.0 -
            64000.0


        let pVar2 =
            pVar1 *
            pVar1 *
            (
                parP6 /
                131072.0
            )


        pVar2 =
            pVar2 +
            pVar1 *
            parP5 *
            2.0


        pVar2 =
            pVar2 / 4.0 +
            parP4 *
            65536.0


        pVar1 =
            (
                parP3 *
                pVar1 *
                pVar1 /
                16384.0 +
                parP2 *
                pVar1
            ) /
            524288.0


        pVar1 =
            (
                1.0 +
                pVar1 /
                32768.0
            ) *
            parP1


        if (pVar1 != 0) {

            let pressure =
                1048576.0 -
                adcPressure


            pressure =
                (
                    pressure -
                    pVar2 /
                    4096.0
                ) *
                6250.0 /
                pVar1


            let p1 =
                parP9 *
                pressure *
                pressure /
                2147483648.0


            let p2 =
                pressure *
                parP8 /
                32768.0


            let p3 =
                (
                    pressure /
                    256.0
                ) *
                (
                    pressure /
                    256.0
                ) *
                (
                    pressure /
                    256.0
                ) *
                (
                    parP10 /
                    131072.0
                )


            pressure =
                pressure +
                (
                    p1 +
                    p2 +
                    p3 +
                    parP7 *
                    128.0
                ) /
                16.0


            // Pa -> hPa
            pressureValue =
                pressure /
                100.0
        }


        // =====================================
        // GAS RESISTANCE
        // =====================================

        let gasMSB =
            readRegister(0x2C)

        let gasLSB =
            readRegister(0x2D)


        let adcGas =
            (gasMSB << 2) |
            (gasLSB >> 6)


        let gasRange =
            gasLSB &
            0x0F


        let gasValid =
            (
                gasLSB &
                0x20
            ) != 0


        let heaterStable =
            (
                gasLSB &
                0x10
            ) != 0


        if (
            gasValid &&
            heaterStable
        ) {

            let gasVar1 =
                262144.0 /
                Math.pow(
                    2,
                    gasRange
                )


            let gasVar2 =
                4096.0 +
                3.0 *
                (
                    adcGas -
                    512.0
                )


            if (gasVar2 != 0) {

                gasResistanceValue =
                    1000000.0 *
                    gasVar1 /
                    gasVar2
            }
        }
    }


    // =========================================
    // OUTPUT BLOCKS
    // =========================================

    //% block="temperature °C"
    //% weight=80
    export function temperature(): number {

        return Math.round(
            temperatureValue * 10
        ) / 10
    }


    //% block="humidity %"
    //% weight=70
    export function humidity(): number {

        return Math.round(
            humidityValue * 10
        ) / 10
    }


    //% block="pressure hPa"
    //% weight=60
    export function pressure(): number {

        return Math.round(
            pressureValue * 10
        ) / 10
    }


    //% block="gas resistance Ω"
    //% weight=50
    export function gasResistance(): number {

        return Math.round(
            gasResistanceValue / 1000
        )
    }
}
