
    import { Component } from "@angular/core";

    // import logging utils
    import { trace, enableTrace, log } from "adorn-ts";

    @enableTrace // enables tracing for class
    @Component({
      selector: "app-root",
      templateUrl: "./app.component.html",
      styleUrls: ["./app.component.css"]
    })
    export class AppComponent {
      @trace() // at property level traces read write operations
      title = "Foo";

      @trace() // at method level traces calling params & return value
      doClick() {
        // log replaces console.log
        log("Inside ngOnInit");
        log("Log method works like console.log");
        log("Accepts","multiple",{params:true});
      }

      @trace('Update Title Called')
      updateTitle() {
        this.title = this.title === 'Foo' ? 'Bar':'Foo';
      }
    }
