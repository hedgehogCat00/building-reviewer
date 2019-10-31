import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DevicePanelService } from './device-panel.service';
import { DevicePanelComponent } from './device-panel.component';
import { BuildingChartModule } from '../building-chart/building-chart.module';
import { MatExpansionModule } from '@angular/material/expansion';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [DevicePanelComponent],
  imports: [
    CommonModule,
    BuildingChartModule,
    // MatAccordion,
    MatExpansionModule,
    FormsModule
  ],
  exports: [DevicePanelComponent],
  providers: [DevicePanelService]
})
export class DevicePanelModule { }
