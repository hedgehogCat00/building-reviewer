import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { BuildingChartService } from './building-chart.service';
import { BuildingChartComponent } from './building-chart.component';


@NgModule({
  declarations: [BuildingChartComponent],
  imports: [
    CommonModule,
    HttpClientModule
  ],
  exports: [BuildingChartComponent],
  providers: [BuildingChartService]
})
export class BuildingChartModule { }
