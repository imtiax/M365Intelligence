import { Controller, Get, Header } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Public } from "../../shared/security/public.decorator";

@ApiTags("health")
@Public()
@Controller("health")
export class HealthController {
  @Get("live")
  live() {
    return { status: "ok", service: "m365ops-api" };
  }

  @Get("ready")
  ready() {
    return { status: "ready", checks: { api: "up" } };
  }

  @Get("metrics")
  @Header("Content-Type", "text/plain; version=0.0.4; charset=utf-8")
  metrics() {
    return [
      "# HELP m365ops_process_uptime_seconds API process uptime.",
      "# TYPE m365ops_process_uptime_seconds gauge",
      `m365ops_process_uptime_seconds ${process.uptime().toFixed(3)}`,
      "# HELP m365ops_build_info Static build information.",
      "# TYPE m365ops_build_info gauge",
      'm365ops_build_info{service="api",version="0.1.0"} 1',
      "",
    ].join("\n");
  }
}
