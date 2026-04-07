/**
 * Registration Facade
 * 
 * Facade Pattern: Simplificar interface compleja del registro
 * 
 * ¿Qué hace el cliente (Controller)?
 * RegistrationFacade.registerStudent(datos)
 * 
 * ¿Qué hace internamente la Facade?
 * 1. UsuarioService.crearUsuario()
 * 2. EmailService.enviarVerificacion()
 * 3. PerfilService.inicializar()
 * 4. ConfiguracionService.crearPorDefecto()
 * 
 * El cliente no necesita saber los detalles. Solo llama a la facade.
 */

/**
 * DTOs para la entrada
 */
export interface RegistrationInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  programId: string;
  semester: number;
}

/**
 * DTOs para la salida
 */
export interface RegistrationOutput {
  success: boolean;
  userId: string;
  email: string;
  message: string;
}

/**
 * Interfaces de servicios que la Facade necesita
 * (inyecciones de dependencia)
 */
export interface IUserService {
  createUser(email: string, password: string, name: string): Promise<string>;
  getUserById(userId: string): Promise<any>;
}

export interface IEmailService {
  sendVerificationEmail(email: string, verificationCode: string): Promise<void>;
}

export interface IProfileService {
  initializeProfile(userId: string, programId: string): Promise<void>;
}

export interface IConfigurationService {
  createDefaultConfig(userId: string, semester: number): Promise<void>;
}

/**
 * La Facade: coordina el flujo completo sin que el cliente sepa los detalles
 */
export class RegistrationFacade {
  constructor(
    private userService: IUserService,
    private emailService: IEmailService,
    private profileService: IProfileService,
    private configService: IConfigurationService
  ) {}

  /**
   * Registro completo en una sola llamada
   * 
   * Internamente coordina:
   * 1. Crear usuario
   * 2. Generar código de verificación
   * 3. Enviar email
   * 4. Inicializar perfil
   * 5. Crear configuración por defecto
   * 
   * El cliente solo llama a esto:
   * const result = await facade.registerStudent({ email, password, ... });
   */
  public async registerStudent(
    input: RegistrationInput
  ): Promise<RegistrationOutput> {
    try {
      // PASO 1: Crear usuario en BD
      const userId = await this.userService.createUser(
        input.email,
        input.password,
        `${input.firstName} ${input.lastName}`
      );

      // PASO 2: Generar código de verificación
      const verificationCode = this.generateVerificationCode();

      // PASO 3: Enviar email de verificación
      // (La facade se encarga, el cliente no necesita saber)
      await this.emailService.sendVerificationEmail(
        input.email,
        verificationCode
      );

      // PASO 4: Inicializar perfil del estudiante
      await this.profileService.initializeProfile(
        userId,
        input.programId
      );

      // PASO 5: Crear configuración por defecto
      await this.configService.createDefaultConfig(
        userId,
        input.semester
      );

      // Retornar resultado simplificado
      return {
        success: true,
        userId,
        email: input.email,
        message: 'Estudiante registrado. Verifica tu email para confirmar tu cuenta.',
      };
    } catch (error) {
      throw new Error(`Error en registro: ${(error as Error).message}`);
    }
  }

  /**
   * Generar código de 6 dígitos para verificación
   */
  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Verificar email (segunda parte del flujo)
   * El usuario recibe un código y lo confirma aquí
   */
  public async verifyEmail(
    userId: string,
    verificationCode: string
  ): Promise<boolean> {
    try {
      // En producción: verificar contra código almacenado en BD
      // await this.userService.verifyEmail(userId, verificationCode);
      
      const user = await this.userService.getUserById(userId);
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      return true;
    } catch (error) {
      throw new Error(`Error verificando email: ${(error as Error).message}`);
    }
  }
}

export default RegistrationFacade;
