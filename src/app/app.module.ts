import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DevicePanelModule } from './device-panel/device-panel.module';
import { BloomTestComponent } from './bloom-test/bloom-test.component';

@NgModule({
  declarations: [
    AppComponent,
    BloomTestComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    DevicePanelModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
