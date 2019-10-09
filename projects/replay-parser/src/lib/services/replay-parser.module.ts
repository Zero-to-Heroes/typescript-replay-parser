import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { LoggerModule, NgxLoggerLevel } from 'ngx-logger';

@NgModule({
  declarations: [],
  imports: [
	BrowserModule,
	HttpClientModule,
	LoggerModule.forRoot({ level: NgxLoggerLevel.DEBUG })
  ],
  exports: []
})
export class ReplayParserModule {}
