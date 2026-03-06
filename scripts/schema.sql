-- =============================================
-- SoportePro - Estructura de base de datos SQL Server
-- Ejecutar en SQL Server Management Studio o sqlcmd
-- =============================================

-- Crear la base de datos (opcional; si ya la creaste en el servidor, comenta esta línea)
-- CREATE DATABASE SoportePro;
-- GO
-- USE SoportePro;
-- GO

-- Si la BD ya existe, ejecuta desde aquí indicando que usas SoportePro:
-- USE SoportePro;
-- GO

-- -----------------------------------------------
-- Tabla: Usuarios (empleados, técnicos, admin)
-- -----------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
  CREATE TABLE Users (
    Id           INT IDENTITY(1,1) PRIMARY KEY,
    Username     NVARCHAR(100) NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    Role         NVARCHAR(50)  NOT NULL DEFAULT N'technician',
    Email        NVARCHAR(255) NULL,
    CreatedAt    DATETIME2     NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT UQ_Users_Username UNIQUE (Username)
  );
  CREATE INDEX IX_Users_Username ON Users(Username);
END
GO

-- -----------------------------------------------
-- Tabla: Tickets
-- -----------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Tickets')
BEGIN
  CREATE TABLE Tickets (
    Id           INT IDENTITY(1,1) PRIMARY KEY,
    TicketNumber NVARCHAR(50)  NOT NULL,
    Status       NVARCHAR(50)  NOT NULL DEFAULT N'Pendiente',
    Branch       NVARCHAR(100) NOT NULL,
    PurchaseDate DATE          NOT NULL,
    Phone        NVARCHAR(50)  NOT NULL,
    Product      NVARCHAR(100) NOT NULL,
    SerialNumber NVARCHAR(100) NOT NULL,
    Description  NVARCHAR(MAX) NOT NULL,
    TaxCredit    NVARCHAR(100) NULL,
    Rnc          NVARCHAR(50)  NULL,
    FileUrl      NVARCHAR(500) NULL,
    CreatedAt    DATETIME2     NOT NULL DEFAULT GETUTCDATE(),
    AssigneeId   INT           NULL,
    CONSTRAINT UQ_Tickets_TicketNumber UNIQUE (TicketNumber),
    CONSTRAINT FK_Tickets_Assignee FOREIGN KEY (AssigneeId) REFERENCES Users(Id)
  );
  CREATE INDEX IX_Tickets_TicketNumber ON Tickets(TicketNumber);
  CREATE INDEX IX_Tickets_Status ON Tickets(Status);
  CREATE INDEX IX_Tickets_CreatedAt ON Tickets(CreatedAt);
END
GO

-- -----------------------------------------------
-- Tabla: Evaluaciones (valoración del servicio)
-- -----------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Evaluations')
BEGIN
  CREATE TABLE Evaluations (
    Id        INT IDENTITY(1,1) PRIMARY KEY,
    TicketId  INT          NOT NULL,
    Rating    INT          NOT NULL,
    Comment   NVARCHAR(MAX) NULL,
    CreatedAt DATETIME2   NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_Evaluations_Ticket FOREIGN KEY (TicketId) REFERENCES Tickets(Id),
    CONSTRAINT CK_Evaluations_Rating CHECK (Rating >= 1 AND Rating <= 5)
  );
  CREATE INDEX IX_Evaluations_TicketId ON Evaluations(TicketId);
END
GO

-- -----------------------------------------------
-- Usuario técnico por defecto (solo para pruebas)
-- En producción: usar bcrypt para PasswordHash y no guardar contraseñas en claro.
-- Para pruebas de login: contraseña "password" (el API compara en texto plano en modo desarrollo).
-- -----------------------------------------------
IF NOT EXISTS (SELECT 1 FROM Users WHERE Username = N'Tech@Helpdesk.Com')
BEGIN
  INSERT INTO Users (Username, PasswordHash, Role, Email)
  VALUES (N'Tech@Helpdesk.Com', N'password', N'technician', N'Tech@Helpdesk.Com');
END
GO

-- Asignar el técnico por defecto a tickets que aún no tengan asignado (opcional)
-- UPDATE t SET AssigneeId = (SELECT Id FROM Users WHERE Username = N'Tech@Helpdesk.Com')
-- FROM Tickets t WHERE t.AssigneeId IS NULL;
