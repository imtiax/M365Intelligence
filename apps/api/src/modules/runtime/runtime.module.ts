import { Global, Module } from "@nestjs/common";
import { LocalStateService } from "./local-state.service";

@Global()
@Module({ providers: [LocalStateService], exports: [LocalStateService] })
export class RuntimeModule {}
