import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DevicePanelModule } from './device-panel/device-panel.module';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    DevicePanelModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
