import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { AccessRequestsService } from "./access-requests.service";
import {
  CreateAccessRequestDto,
  UpdateAccessRequestStatusDto,
} from "./dto/create-access-request.dto";

@Controller("access-requests")
export class AccessRequestsController {
  constructor(private readonly accessRequestsService: AccessRequestsService) {}

  @Post()
  create(@Body() dto: CreateAccessRequestDto) {
    return this.accessRequestsService.create(dto);
  }

  @Get()
  findAll() {
    return this.accessRequestsService.findAll();
  }

  @Patch(":id/status")
  updateStatus(
    @Param("id") id: string,
    @Body() dto: UpdateAccessRequestStatusDto,
  ) {
    return this.accessRequestsService.updateStatus(id, dto);
  }
}
