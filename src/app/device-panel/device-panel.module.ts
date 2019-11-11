import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { DevicePanelService } from './device-panel.service';
import { DevicePanelComponent } from './device-panel.component';
import { BuildingChartModule } from '../building-chart/building-chart.module';
import { FormsModule } from '@angular/forms';
import {
  MatButtonModule,
  MatExpansionModule
} from '@angular/material';

@NgModule({
  declarations: [
    DevicePanelComponent,
  ],
  imports: [
    CommonModule,
    BuildingChartModule,
    MatButtonModule,
    MatExpansionModule,
    FormsModule,
    FlexLayoutModule
  ],
  exports: [DevicePanelComponent],
  providers: [DevicePanelService]
})
export class DevicePanelModule { }
