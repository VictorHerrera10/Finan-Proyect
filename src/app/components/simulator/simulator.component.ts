import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Data, Router } from '@angular/router';
import { DataService } from 'src/app/services/data.service';
import { AuthService } from 'src/app/services/auth.service';
import * as financial from 'financial';
import { npv } from 'financial';
import { ChangeDetectorRef } from '@angular/core'


@Component({
  selector: 'app-simulator',
  templateUrl: './simulator.component.html',
  styleUrls: ['./simulator.component.css']
})
export class SimulatorComponent{

  currentDate: string;

  //Datos del prestamo
  precioActivo: number;
  saldos: number = 0;
  saldo: number = 0;
  tasaEfectivaAnual: number = 8.49;
  tasaEfectivaMensual: number = 0;
  numeroCuotas: number = 36;
  cuota: number = 0.0;
  periodoGracia: number = 0.0;
  cuotaInicial: number;
  cuotaFinal: number = 0;
  montoPrestamo: number = 0;
  periodoGraciaNumerico: number = 0;
  tipoCambio: number = 3.5;
  cok: number = 0;

  //Datos del cuoton
  sicuoton: number = 0;

  saldoFinalCuoton: number[] = [];
  saldoInicialCuoton: number[] = [];
  interesCuoton: number[] = [];
  amortizacionCuoton: number[] = [];  
  degravamenCuoton: number[] = [];


  //Datos de los costes/gatos iniciales
  costesRegistralesNumerico: number = 0;
  costesNotarialesNumerico: number = 0;
  efectivoNotarial: boolean = false;
  prestamoNotarial: boolean = false;
  prestamoRegistral: boolean = false;
  efectivoRegistral: boolean = false;


  //Datos de los costes-datos periodicos
  gps: number = 0;
  portes: number = 0;
  gastosAdmin: number = 0;
  gpsArr: number[] = [];
  portesArr: number[] = [];
  gastosAdminArr: number[] = [];
  SeguroDregravamen: number = 0.0280;
  SeguroRiesgo: number = 0.30;
  valorSeguroDregravamen: number = 0.00;
  valorSeguroRiesgo: number = 0.00;

  //Datos del costo de oportunidad
  tasaDescuento: number = 50;

  //Resultados
  tir: number = 0;
  resultadoDescuento: number = 0;
  tcea: number = 0;
  van: number = 0;
  mostrarResultados: boolean = false;


  tasaFinal: number = 0.0;
  degravamenMensual: number = 0.0;
  numeroCuotasTemp: number = this.numeroCuotas;


  tasaEfectivaInvalid: boolean = false;
  cuotaInicialInvalid: boolean = false;
  cuotaFinalInvalid: boolean = false;
  numeroCuotasInvalid: boolean = false;
  precioActivoInvalid: boolean = false;
  precioGPSInvalid: boolean = false;
  precioPortesInvalid: boolean = false;
  precioAdministracionInvalid: boolean = false;
  costesnotarialesInvalid: boolean = false;
  costesregistralesInvalid: boolean = false;


  mostrarTabla: boolean = false;
  periodoGraciaTotal: boolean = false;
  periodoGraciaParcial: boolean = false;
  enDolares: boolean = false;
  enCuotas: boolean = false;

  cronograma: number[] = [];
  cuotaArr: number[] = [];
  saldoFinal: number[] = [];
  saldoInicial: number[] = [];
  interes: number[] = [];
  amortizacion: number[] = [];  
  inmueble: number[] = [];
  degravamen: number[] = [];
  flujoEfectivo: number[] = [];

  constructor(private dataService: DataService, private authService: AuthService, private cdr: ChangeDetectorRef) {
    this.currentDate = new Date().toLocaleDateString();
    this.precioActivo = 0;
    this.cuotaInicial = 0;
    this.resetArrays();
 
  }

  Limpiar() {
    // Recargar la página
    location.reload();
  }


  resetArrays(): void {
    this.cronograma = Array.from({ length: this.numeroCuotas }, (_, i) => i + 1);
    this.saldoFinal = [];
    this.saldoInicial = [];
    this.interes = [];
    this.amortizacion = [];
    this.cuotaArr = [];
    this.gpsArr = [];
    this.portesArr = [];
    this.gastosAdminArr = [];
  }

  convertirASoles(valor: number): number {
    return valor * this.tipoCambio;    
  }

  convertirADolares(valor: number): number {
    return valor / this.tipoCambio;  
  }

  obtenerFecha(index: number): string {
    const fechaActual = new Date(); 
    const fecha = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + index, fechaActual.getDate()); 
  
    const dia = fecha.getDate().toString().padStart(2, '0'); 
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0'); 
    const anio = fecha.getFullYear();
  
    return `${dia}-${mes}-${anio}`;

  }

  togglePeriodoGracia(opcion: string): void {
    this.periodoGraciaTotal = opcion === 'total';
    this.periodoGraciaParcial = opcion === 'parcial';
  }

  toggleCostesNotariales(opcion: string): void {
    this.efectivoNotarial = opcion === 'efectivo';
    this.prestamoNotarial = opcion === 'prestamo';
  }

  toggleCostesRegistrales(opcion: string): void {
    this.prestamoRegistral = opcion === 'prestamo';
    this.efectivoRegistral = opcion === 'efectivo';
  }
  

  validarActivo(): void {
    this.precioActivoInvalid = this.precioActivo < 0;   
    this.resetArrays();
  }

  validarNumeroCuotas(): void {
    this.numeroCuotasInvalid = this.numeroCuotas < 30|| this.numeroCuotas > 300;
    this.resetArrays();
  }
  
  validarTasaEfectiva(): void {
    this.tasaEfectivaInvalid = this.tasaEfectivaAnual < 8.49 || this.tasaEfectivaAnual > 20.26;
    this.resetArrays();
  }

  validarCuotaInicial(): void {
    this.cuotaInicialInvalid = this.cuotaInicial < 0.2 * this.precioActivo || this.cuotaInicial > this.precioActivo;
    this.resetArrays();
  }

  validarCuotaFinal(): void {
    this.cuotaFinalInvalid = this.cuotaFinal < 0.2 * this.precioActivo || this.cuotaFinal > this.precioActivo;
    this.resetArrays();
  }
  
  validarGPS(): void {
    this.precioGPSInvalid = this.gps < 0 || this.gps > 100 ;
    this.resetArrays();
  }

  validarGAdministracion(): void {
    this.precioAdministracionInvalid = this.gastosAdmin < 0 || this.gastosAdmin > 100 ;
    this.resetArrays();
  }

  validarPortes(): void {
    this.precioPortesInvalid = this.portes < 0 || this.portes > 100 ;
    this.resetArrays();
  }

  validarCostesNotariales(): void {
    this.costesnotarialesInvalid = this.costesNotarialesNumerico < 0  ;
    this.resetArrays();
  }

  validarCostesRegistrales(): void {
    this.costesregistralesInvalid = this.costesRegistralesNumerico < 0  ;
    this.resetArrays();
  }

  

  CambioTasa(): void{
    this.tasaEfectivaMensual = Math.pow(1+ (this.tasaEfectivaAnual/100),(1/12))-1
  }

  actualizarCuotaInicial() {
    console.log('actualizarCuotaInicial() called');
    console.log('Precio activo:', this.precioActivo);

    if (!isNaN(this.precioActivo)) {
      this.cuotaInicial = 0.2 * this.precioActivo;
      // Manually trigger change detection to update the view
      this.cdr.detectChanges();
    } else {
      console.error('El precio activo no es un número válido.');
    }
  } 

  CalcularMontoPrestamo(): void{
    let montoPrestamo: number;

    switch (true) {
      case this.efectivoNotarial && this.efectivoRegistral:
        montoPrestamo = this.precioActivo - this.cuotaInicial;
        break;
      case this.prestamoNotarial && this.prestamoRegistral:
        montoPrestamo = this.precioActivo - this.cuotaInicial + this.costesNotarialesNumerico + this.costesRegistralesNumerico;
        break;
      case this.prestamoNotarial && this.efectivoRegistral:
        montoPrestamo = this.precioActivo - this.cuotaInicial + this.costesNotarialesNumerico;
        break;
      case this.prestamoRegistral:
        montoPrestamo = this.precioActivo - this.cuotaInicial + this.costesRegistralesNumerico;
        break;
      case this.prestamoNotarial:
        montoPrestamo = this.precioActivo - this.cuotaInicial + this.costesNotarialesNumerico;
        break;
      case this.efectivoNotarial:
        montoPrestamo = this.precioActivo - this.cuotaInicial;
        break;
      default:
        montoPrestamo = this.precioActivo - this.cuotaInicial;
    }
    this.montoPrestamo = montoPrestamo;
  }

  GenerarCuota(): void {
    this.obtenerCuotas();
    this.CambioTasa();
    this.CalcularMontoPrestamo();
    this.cuotaArr = [];
    this.tasaFinal = (this.tasaEfectivaMensual) + (this.SeguroDregravamen/100);
    this.saldo = this.montoPrestamo - (this.cuotaFinal)/Math.pow((1+this.tasaFinal),(this.numeroCuotas+1));
    
    this.valorSeguroRiesgo = (this.SeguroRiesgo/100)*(this.precioActivo/12);

    console.log(this.tasaFinal);

    
    if (this.enDolares) {
      this.saldo = this.convertirADolares(this.saldo);
    
    }

    if(this.periodoGraciaTotal == true || this.periodoGraciaParcial == true) {
      this.numeroCuotasTemp = this.numeroCuotas - this.periodoGraciaNumerico;
    } else {
      this.numeroCuotasTemp = this.numeroCuotas;
    }
  
    this.cuota =
      (this.saldo * this.tasaFinal) / (1-Math.pow((1+ this.tasaFinal),-this.numeroCuotas))     ;
  
    this.cuota = Number(this.cuota);

    for (let i = 0; i < this.numeroCuotas; i++) {
      this.gpsArr.push(Number(this.gps.toFixed(2)));
    }
    for (let i = 0; i < this.numeroCuotas; i++) {
      this.portesArr.push(Number(this.portes.toFixed(2)));
    }
    for (let i = 0; i < this.numeroCuotas; i++) {
      this.gastosAdminArr.push(Number(this.gastosAdmin.toFixed(2)));
    }
  
    for (let i = 0; i < this.numeroCuotas; i++) {
      if (i < this.periodoGraciaNumerico && this.periodoGraciaTotal) {
        this.cuotaArr.push(0);
      } else if (i < this.periodoGraciaNumerico && this.periodoGraciaParcial) {
        this.cuotaArr.push(0);
      } else {
        this.cuotaArr.push(Number(this.cuota));
      }
    }
  }

  calcularCuoton(): void{     

    this.tasaFinal = (this.tasaEfectivaMensual) + (this.SeguroDregravamen/100);    
    this.sicuoton = this.cuotaFinal/Math.pow(1+this.tasaFinal,this.numeroCuotas+1);
  
    for (let i = 0; i < this.numeroCuotas+1; i++) {
      this.saldoInicialCuoton.push(Number(this.sicuoton));

      const interes = this.saldoInicialCuoton[i] * (this.tasaEfectivaMensual);
      this.interesCuoton.push(Number(interes.toFixed(2)));

      const degravamenTemp = this.saldoInicialCuoton[i] * (this.SeguroDregravamen/100);
      this.degravamenCuoton.push(Number(degravamenTemp));

      if (i == this.numeroCuotas) {
        const amortizacion = this.interesCuoton[i] + this.degravamenCuoton[i] + this.saldoInicialCuoton[i] ;
        this.amortizacionCuoton.push(Number(amortizacion.toFixed(2)));        
      }
      else{
        const amortizacion = 0.00;
        this.amortizacionCuoton.push(Number(amortizacion.toFixed(2)));     
      }

      this.sicuoton += this.interesCuoton[i]+this.degravamenCuoton[i]-this.amortizacionCuoton[i];
      this.saldoFinalCuoton.push(Number(this.sicuoton.toFixed(2)));
    }

  }


  calcularSaldoFinal(): void {
    this.saldoFinal = [];
    this.interes = [];
    this.amortizacion = [];
    this.inmueble = [];
    this.degravamen = [];
    this.valorSeguroRiesgo = (this.precioActivo/12) * (this.SeguroRiesgo/100);
  
    switch (true) {
      case this.periodoGraciaParcial:
        this.GenerarCuota();

        for (let i = 0; i < this.periodoGraciaNumerico; i++) {
          this.saldoInicial.push(Number(this.saldo.toFixed(2)));

          const interes = this.saldoInicial[i] * (this.tasaEfectivaMensual);
          this.interes.push(Number(interes.toFixed(2)));

          this.cuotaArr[i] = Number(interes.toFixed(9));

          this.saldoFinal.push(Number(this.saldo.toFixed(2)));

          this.amortizacion.push(0);
          const degravamenTemp = this.saldoInicial[i] * (this.SeguroDregravamen/100);
          this.degravamen.push(Number(degravamenTemp));
          this.inmueble.push(0);
        }



        this.cuota =
          this.saldo * (this.tasaFinal / (1 - ( Math.pow((1 + this.tasaFinal) , -(this.numeroCuotas-this.periodoGraciaNumerico)) )));

        for(let i = this.periodoGraciaNumerico; i < this.numeroCuotas; i++) {
          this.saldoInicial.push(Number(this.saldo.toFixed(2)));
          this.cuotaArr[i] = Number(this.cuota);

          const interes = this.saldoInicial[i] * (this.tasaEfectivaMensual);
          this.interes.push(Number(interes.toFixed(2)));

          const degravamenTemp = this.saldoInicial[i] * (this.SeguroDregravamen/100);
          this.degravamen.push(Number(degravamenTemp));

          const amortizacion = this.cuota - this.interes[i] - degravamenTemp - this.valorSeguroRiesgo;
          this.amortizacion.push(Number(amortizacion.toFixed(2)));

          this.saldo -= this.amortizacion[i];
          this.saldoFinal.push(Number(this.saldo.toFixed(2)));

          this.inmueble.push(Number(this.valorSeguroRiesgo.toFixed(2)));
        }
        this.amortizacion[this.numeroCuotas-1]=this.saldoFinal[this.numeroCuotas-2]
        this.saldoFinal[this.numeroCuotas-1]=0.00;

        
        break;
  
      case this.periodoGraciaTotal:
        this.GenerarCuota();

        for (let i = 0; i < this.periodoGraciaNumerico; i++) {
          this.saldoInicial.push(Number(this.saldo.toFixed(2)));

          const interes = this.saldoInicial[i] * (this.tasaEfectivaMensual);
          this.interes.push(Number(interes.toFixed(2)));

          this.saldo += this.interes[i];
          this.saldoFinal.push(Number(this.saldo.toFixed(2)));

          this.amortizacion.push(0);
          const degravamenTemp = this.saldoInicial[i] * (this.SeguroDregravamen/100);
          this.degravamen.push(Number(degravamenTemp));
          this.inmueble.push(0);
        }



        this.cuota =
          (this.saldo *
          ((this.tasaFinal * Math.pow(1 + this.tasaFinal , this.numeroCuotasTemp)) /
          (Math.pow(1 + this.tasaFinal , this.numeroCuotasTemp) - 1)));

        for(let i = this.periodoGraciaNumerico; i < this.numeroCuotas; i++) {
          this.saldoInicial.push(Number(this.saldo.toFixed(2)));

          this.cuotaArr[i] = Number(this.cuota);

          const interes = this.saldoInicial[i] * (this.tasaEfectivaMensual);
          this.interes.push(Number(interes.toFixed(2)));

          const degravamenTemp = this.saldoInicial[i] * (this.SeguroDregravamen/100);
          this.degravamen.push(Number(degravamenTemp));

          const amortizacion = this.cuota - this.interes[i] - degravamenTemp - this.valorSeguroRiesgo;
          this.amortizacion.push(Number(amortizacion.toFixed(2)));

          this.saldo -= this.amortizacion[i];
          this.saldoFinal.push(Number(this.saldo.toFixed(2)));

          this.inmueble.push(Number(this.valorSeguroRiesgo.toFixed(2)));
        }
        this.amortizacion[this.numeroCuotas-1]=this.saldoFinal[this.numeroCuotas-2]
        this.saldoFinal[this.numeroCuotas-1]=0.00;
        break;
  
      default:
        this.GenerarCuota();
        
  
        for (let i = 0; i < this.numeroCuotas; i++) {
          this.saldoInicial.push(Number(this.saldo.toFixed(2)));
  
          const interes = this.saldoInicial[i] * (this.tasaEfectivaMensual);
          this.interes.push(Number(interes.toFixed(2)));

          const degravamenTemp = this.saldoInicial[i] * (this.SeguroDregravamen/100);
          this.degravamen.push(Number(degravamenTemp));
  
          const amortizacion = this.cuota - this.interes[i] - degravamenTemp;
          this.amortizacion.push(Number(amortizacion.toFixed(2)));
  
          this.saldo -= this.amortizacion[i];
          this.saldoFinal.push(Number(this.saldo.toFixed(2)));
          this.inmueble.push(Number(this.valorSeguroRiesgo.toFixed(2)));
        }
        this.amortizacion[this.numeroCuotas-1]=this.saldoFinal[this.numeroCuotas-2]
        this.saldoFinal[this.numeroCuotas-1]=0.00;
        break;
    }
    if (this.enDolares) {      
      this.saldoInicial = this.saldoInicial.map((saldo) => this.convertirADolares(saldo));
      this.interes = this.interes.map((interes) => this.convertirADolares(interes));
      this.amortizacion = this.amortizacion.map((amortizacion) => this.convertirADolares(amortizacion));
      this.saldoFinal = this.saldoFinal.map((saldoFinal) => this.convertirADolares(saldoFinal));
    }
  }

  ontenerMoneda (): string {
    if(this.enDolares == false) {
      return "Soles";
    } else {
      return "Dolares";
    }
  }

  obtenerCuotas (): void {
    if(this.enCuotas == false) {
      this.numeroCuotas=24;
    } else {
      this.numeroCuotas=36;
    }
  }

  obtenerGraciaParcial (): number {
    if(this.periodoGraciaParcial == true && this.periodoGraciaTotal == false){
      return this.periodoGraciaNumerico;
    } else if(this.periodoGraciaTotal == true && this.periodoGraciaParcial == false){
      return 0;
    } else {
      return 0;
    }
  }

  obtenerGraciaTotal (): number {
    if(this.periodoGraciaParcial == true && this.periodoGraciaTotal == false){
      return 0;
    } else if(this.periodoGraciaTotal == true && this.periodoGraciaParcial == false){
      return this.periodoGraciaNumerico;
    } else {
      return this.periodoGraciaNumerico;
    }
  }

  CalcularFlujoEfectivo(): void{

    switch (true) {
      case this.periodoGraciaParcial:

      this.flujoEfectivo[0]= -(this.montoPrestamo)      

      for (let i = 0; i < this.periodoGraciaNumerico; i++) {
        this.flujoEfectivo.push(this.degravamen[i]+this.cuotaArr[i]+this.valorSeguroRiesgo);
      }

      for (let i = this.periodoGraciaNumerico; i < this.numeroCuotas ; i++) {
        this.flujoEfectivo.push(this.cuotaArr[i]+this.gpsArr[i]+this.portesArr[i]+this.gastosAdminArr[i]+this.valorSeguroRiesgo);        
      }

      this.flujoEfectivo.push(this.cuotaFinal+this.gps+this.portes+this.gastosAdmin+this.valorSeguroRiesgo); 

      break;
  
      case this.periodoGraciaTotal:
        this.flujoEfectivo[0]= -(this.montoPrestamo)
        // Agrega la cuota inicial negativa como el primer flujo de efectivo

        for (let i = 0; i < this.periodoGraciaNumerico; i++) {
          this.flujoEfectivo.push(this.degravamen[i] + this.valorSeguroRiesgo); // Agrega los flujos de amortización a la matriz
        }
   
       // Suponiendo que this.amortizacion es una matriz de flujos de amortización para cada período
       for (let i = this.periodoGraciaNumerico; i < this.numeroCuotas ; i++) {
         this.flujoEfectivo.push(this.cuotaArr[i]+this.gpsArr[i]+this.portesArr[i]+this.gastosAdminArr[i]+this.valorSeguroRiesgo); // Agrega los flujos de amortización a la matriz
       }
   
       this.flujoEfectivo.push(this.cuotaFinal+this.gps+this.portes+this.gastosAdmin+this.valorSeguroRiesgo);


        break;
  
      default:
        this.flujoEfectivo[0]= -(this.montoPrestamo)
        // Agrega la cuota inicial negativa como el primer flujo de efectivo
   
       // Suponiendo que this.amortizacion es una matriz de flujos de amortización para cada período
       for (let i = 0; i < this.numeroCuotas; i++) {
         this.flujoEfectivo.push(this.cuotaArr[i]+this.gpsArr[i]+this.portesArr[i]+this.gastosAdminArr[i]+this.valorSeguroRiesgo); // Agrega los flujos de amortización a la matriz
       }
   
       this.flujoEfectivo.push(this.cuotaFinal+this.gps+this.portes+this.gastosAdmin+this.valorSeguroRiesgo);   


       break;
    }

  }

  CalcularTIR(): void {

    this.CalcularFlujoEfectivo();
    
    const tir = financial.irr(this.flujoEfectivo);
       
    const tirfix= Number((tir * 100).toFixed(11));

    this.tir = tirfix;

  }

  CalcularTasaDescuento(): void {
    this.resultadoDescuento = (Math.pow(1+(this.tasaDescuento/100),(30/360)) -1)*100;

  }

  CalcularTCEA(tir: number): void {
    this.tcea = (Math.pow(1+(tir/100),(360/30))-1)*100;
  }
  CalcularVAN(): void {
    const tasaDescuento = this.resultadoDescuento/100; // convertir el resultado del descuento a porcentaje
    const flujoEfectivoSinMontoPrestamo = this.flujoEfectivo.slice(1); // tomar el flujo de efectivo sin el primer elemento
    // Calcular el VAN
    this.van =  this.montoPrestamo - npv(tasaDescuento, flujoEfectivoSinMontoPrestamo) ;

  }
  


  Operacion() {

    const porcentajeCuotaInicial = (this.cuotaInicial / this.precioActivo) * 100;
    const porcentajeCuotaFinal = (this.cuotaFinal / this.precioActivo) * 100;

    if (porcentajeCuotaInicial < 20) {
      alert('La cuota inicial debe ser mayor al 20% del activo.');
      return; 
    } else if (porcentajeCuotaFinal < 20){
      alert('La cuota final debe ser mayor al 20% del activo.');
      return; 
    }else if ( this.precioActivo == 0){
      alert('Ingresa un valor a calcular en el precio del activo');
      return; 
    }

  
    if (!this.precioActivoInvalid && !this.tasaEfectivaInvalid && !this.cuotaInicialInvalid && !this.numeroCuotasInvalid && !this.precioGPSInvalid && !this.cuotaFinalInvalid && !this.costesnotarialesInvalid && !this.costesregistralesInvalid) {            
      
      
      this.calcularSaldoFinal();
      this.calcularCuoton();
      
      this.generarCronograma();  
      
      this.CalcularTIR();
      this.CalcularTasaDescuento();
      this.CalcularTCEA(this.tir);
      this.CalcularVAN();

      this.mostrarResultados = true;

      this.mostrarTabla = true;
      console.log(this.periodoGraciaParcial);
      console.log(this.periodoGraciaTotal);

      

      const monedaN = this.ontenerMoneda();
      const precioViviendaN = Number(this.precioActivo.toFixed(2));
      const cuotaInicialN = Number(this.cuotaInicial.toFixed(2));
      const tasaEfectivaN = Number(this.tasaEfectivaAnual.toFixed(2));
      const numeroCuotasN = Number(this.numeroCuotas.toFixed(2));
      const periodoGraciaN = Number(this.periodoGraciaNumerico.toFixed(2));
      const periodoGraciaParcialN = this.obtenerGraciaParcial();
      const periodoGraciaTotalN = this.obtenerGraciaTotal();
      const cuotaN = Number(this.cuota.toFixed(2));
      const tirN = Number(this.tir.toFixed(2));
      const tasadescuento = Number(this.resultadoDescuento.toFixed(2));      
      const tcea = Number(this.tcea.toFixed(2));
      const van = Number(this.van.toFixed(2));
      const userIdN = this.authService.getUser()?.id;

      const newItem = {
        moneda: monedaN,
        precioVivienda: precioViviendaN,
        cuotaInicial: cuotaInicialN,
        tasaEfectiva: tasaEfectivaN,
        numeroCuotas: numeroCuotasN,
        periodoGracia: periodoGraciaN,
        periodoGraciaParcial: periodoGraciaParcialN,
        periodoGraciaTotal: periodoGraciaTotalN,
        cuota: cuotaN,
        tir: tirN,
        tasadescuento:tasadescuento,
        tcea:tcea,
        van:van,
        userId: userIdN
      } as Data;
      
      this.dataService.createItem(newItem).subscribe(
        res => {
          console.log("Usuario agregado exitosamente");
        },
        error => {
          console.log("Ocurrió un error al agregar el usuario");
          console.log(error);
        }
      );
    } 
    else {      
      this.cuota = 0;
      this.resetArrays();
      this.cronograma = [];
      
      this.mostrarTabla = false; 
    }
  }

  generarCronograma(): void {
    this.cronograma = [];
    for (let i = 0; i < this.numeroCuotas; i++) {
      this.cronograma.push(i + 1);
    }
  }
}
