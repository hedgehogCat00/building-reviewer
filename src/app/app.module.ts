import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BuildingChartComponent } from './building-chart/building-chart.component';
import { BuildingChartModule } from './building-chart/building-chart.module';

@NgModule({
  declarations: [
    AppComponent,
    BuildingChartComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BuildingChartModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
