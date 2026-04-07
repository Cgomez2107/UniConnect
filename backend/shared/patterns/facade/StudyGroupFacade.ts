/**
 * Study Group Creation Facade
 * 
 * Coordina la creación completa de un grupo de estudio
 * 
 * ¿Qué hace el cliente?
 * StudyGroupFacade.createGroup(datos)
 * 
 * ¿Qué hace la Facade internamente?
 * 1. Validar que el usuario pueda crear grupos (no está saturado)
 * 2. Crear el grupo en BD
 * 3. Asignar autoría
 * 4. Crear configuración inicial
 * 5. Notificar a la universidad (opcional)
 */

export interface CreateStudyGroupInput {
  userId: string;
  groupName: string;
  subjectId: string;
  maxMembers: number;
  description: string;
}

export interface CreateStudyGroupOutput {
  success: boolean;
  groupId: string;
  groupName: string;
  message: string;
}

export interface IStudyGroupRepository {
  create(groupId: string, data: any): Promise<void>;
  findById(groupId: string): Promise<any>;
}

export interface IGroupMembershipService {
  addMember(groupId: string, userId: string, role: 'admin' | 'member'): Promise<void>;
}

export interface IGroupConfigService {
  createDefaultConfig(groupId: string): Promise<void>;
}

export interface INotificationService {
  notifyGroupCreated(groupId: string, groupName: string): Promise<void>;
}

export class StudyGroupFacade {
  constructor(
    private groupRepository: IStudyGroupRepository,
    private membershipService: IGroupMembershipService,
    private configService: IGroupConfigService,
    private notificationService: INotificationService
  ) {}

  /**
   * Creación completa de grupo en una sola llamada
   */
  public async createStudyGroup(
    input: CreateStudyGroupInput
  ): Promise<CreateStudyGroupOutput> {
    try {
      const groupId = this.generateGroupId();

      // PASO 1: Crear grupo en BD
      await this.groupRepository.create(groupId, {
        name: input.groupName,
        subjectId: input.subjectId,
        maxMembers: input.maxMembers,
        description: input.description,
        createdAt: new Date(),
      });

      // PASO 2: Asignar creador como admin
      await this.membershipService.addMember(groupId, input.userId, 'admin');

      // PASO 3: Crear configuración por defecto
      await this.configService.createDefaultConfig(groupId);

      // PASO 4: Notificar (opcional, asíncrono)
      await this.notificationService.notifyGroupCreated(groupId, input.groupName);

      return {
        success: true,
        groupId,
        groupName: input.groupName,
        message: 'Grupo de estudio creado exitosamente',
      };
    } catch (error) {
      throw new Error(`Error creando grupo: ${(error as Error).message}`);
    }
  }

  /**
   * Generar ID único para grupo
   */
  private generateGroupId(): string {
    return `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default StudyGroupFacade;
