import { Controller, Get, Post, Put, Delete, Param, Body, Res, Inject } from "@nestjs/common";
import type { Response } from "express";
import type { ApiResponse, Project, ProjectInput } from "@termloop/shared";
import { ProjectsService } from "./projects.service.js";

@Controller("projects")
export class ProjectsController {
  constructor(@Inject(ProjectsService) private readonly projects: ProjectsService) {}

  @Get()
  list(): ApiResponse<Project[]> {
    return { success: true, data: this.projects.list() };
  }

  @Get(":id")
  get(
    @Param("id") id: string,
    @Res({ passthrough: true }) res: Response
  ): ApiResponse<Project> | ApiResponse {
    const project = this.projects.get(id);
    if (!project) {
      res.status(404);
      return { success: false, error: "Project not found" };
    }
    return { success: true, data: project };
  }

  @Post()
  create(
    @Body() input: ProjectInput,
    @Res({ passthrough: true }) res: Response
  ): ApiResponse<Project> {
    const project = this.projects.create(input);
    res.status(201);
    return { success: true, data: project };
  }

  @Put(":id")
  update(
    @Param("id") id: string,
    @Body() updates: Partial<Project>,
    @Res({ passthrough: true }) res: Response
  ): ApiResponse<Project> | ApiResponse {
    const updated = this.projects.update(id, updates);
    if (!updated) {
      res.status(404);
      return { success: false, error: "Project not found" };
    }
    return { success: true, data: updated };
  }

  @Delete(":id")
  remove(
    @Param("id") id: string,
    @Res({ passthrough: true }) res: Response
  ): ApiResponse {
    const deleted = this.projects.delete(id);
    if (!deleted) {
      res.status(404);
      return { success: false, error: "Project not found" };
    }
    return { success: true };
  }
}
