import { HttpClientModule } from '@angular/common/http';
import { ModuleWithProviders } from '@angular/compiler/src/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { LoggerModule, NgxLoggerLevel } from 'ngx-logger';

@NgModule({
	declarations: [],
	imports: [BrowserModule, HttpClientModule, LoggerModule.forRoot({ level: NgxLoggerLevel.DEBUG })],
	exports: [],
})
export class ReplayParserModule {
	static forRoot(): ModuleWithProviders {
		return {
			ngModule: ReplayParserModule,
			providers: [],
		};
	}
}
