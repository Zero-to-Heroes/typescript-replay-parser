import { HttpClientModule } from '@angular/common/http';
import { ModuleWithProviders } from '@angular/compiler/src/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

@NgModule({
	declarations: [],
	imports: [BrowserModule, HttpClientModule],
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
