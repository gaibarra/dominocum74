# Manual de Usuario - Dominó CUM 74

Bienvenido a la aplicación oficial de **Dominó CUM 74**. Esta guía te ayudará a utilizar todas las funciones del sistema para gestionar tus veladas de dominó, llevar el control de puntos, asistencias y estadísticas de manera sencilla.

---

## 1. Inicio y Panel Principal

Al entrar a la aplicación, verás la pantalla de inicio con las opciones principales:

*   **Nueva Velada:** Para comenzar un nuevo evento de dominó desde cero.
*   **Continuar Velada:** Si hay un juego en curso, verás un botón destacado para retomarlo inmediatamente.
*   **Historial:** Consulta los resultados de veladas anteriores.
*   **Jugadores:** Administra la lista de participantes.
*   **Estadísticas:** Revisa quiénes son los mejores jugadores, parejas y récords.

---

## 2. Gestión de Jugadores

Antes de jugar, asegúrate de que todos los participantes estén registrados.

1.  Ve a la sección **Jugadores**.
2.  Verás la lista de todos los miembros del club.
3.  **Crear nuevo jugador:** Pulsa el botón "Nuevo Jugador", ingresa su nombre, apodo (obligatorio) y correo (opcional).
4.  **Editar:** Si alguien cambió de teléfono o quieres corregir un nombre, pulsa sobre su tarjeta para editarlo.

---

## 3. Comenzar una Velada (El Juego)

### Crear la Velada
1.  Pulsa en **Nueva Velada**.
2.  Confirma la fecha y aprovecha los nuevos campos opcionales:
    *   **Lugar (`location_name`):** describe el sitio principal donde se jugará (ej. "Casa de Juan" o "Salón CUM").
    *   **Detalle logístico (`location_details`):** agrega indicaciones extras como estacionamiento, acceso o recordatorios para la mesa técnica.
    Esta información se mostrará automáticamente en la cabecera del tablero para que todos sepan dónde reunirse y qué preparativos considerar.
3.  El sistema creará el evento y te llevará al **Panel de Control de la Velada**.

### Panel de Control de la Velada
Aquí ocurre toda la acción. En la parte superior verás el resumen (fecha, estado) y tres secciones importantes:

#### A. Asistencia (Check-in)
Es vital registrar quiénes llegaron para poder asignarlos a las mesas.
*   **Entrada:** Selecciona el nombre del jugador en la lista desplegable y pulsa "Entrada".
*   **Banca:** Los jugadores que ya llegaron pero no están jugando aparecen aquí.
*   **Salida:** Si alguien se retira antes de que termine la velada, busca su nombre en la banca y pulsa "Salir".
    *   *Nota:* Si olvidas dar salida a alguien, el sistema lo hará automáticamente al final basándose en su última partida jugada.

#### B. Mesas de Juego
Aquí se registran los puntos.
1.  **Agregar Mesa:** Pulsa el botón flotante o "Agregar Mesa". Necesitas tener al menos **4 jugadores disponibles en la banca**.
2.  **Seleccionar Parejas:** Elige quién jugará con quién.
3.  **Anotar Puntos (Manos):**
    *   Dentro de la tarjeta de la mesa, pulsa "Agregar Mano".
    *   Ingresa los puntos de la Pareja 1 y la Pareja 2.
    *   El sistema suma automáticamente.
4.  **Finalizar Partida:** Cuando una pareja llega a los puntos necesarios (usualmente 100), aparecerá el botón para **Finalizar Mesa**. Al hacerlo:
    *   Se declara la pareja ganadora.
    *   Los 4 jugadores quedan liberados y vuelven a la "Banca" para poder jugar en otra mesa.

#### C. Anécdotas
¿Pasó algo gracioso o memorable?
*   Ve a la sección de **Anécdotas** al final de la pantalla.
*   Escribe lo que sucedió o sube una foto/video del momento.
*   Esto quedará guardado en el historial de la velada.

---

## 4. Finalizar la Velada

Cuando ya no se vayan a jugar más partidas:
1.  Asegúrate de que todas las mesas estén finalizadas o canceladas.
2.  Ve a la parte superior y cambia el estado de "En Curso" a **"Finalizada"**.
3.  Esto cerrará el registro de asistencias y guardará todas las estadísticas permanentemente.

---

## 5. Estadísticas y Rankings

¿Quién es el mejor?
*   En la sección **Estadísticas**, puedes ver tablas de posiciones actualizadas automáticamente.
*   **Filtros:** Puedes ver estadísticas generales, por año o por mes.
*   **Datos disponibles:** Partidas ganadas, efectividad (%), zapateros (partidas ganadas 100-0) y más.

---

## 6. Cierre Operativo

Antes de archivar una velada, recorre este checklist para evitar datos incompletos:

1.  **Revisa las mesas activas:** En la sección *Mesas de Juego*, asegúrate de que cada tarjeta tenga el estado de partida finalizado o cancelado. Si alguna sigue abierta, termina la mano final o usa la opción de cancelar antes de cerrar la velada.
2.  **Registra las salidas:** Desde la sección de **Asistencia** (gestionada por `useAttendance`), marca la salida de los jugadores que aún aparezcan en banca. Esto garantiza que el historial refleje quién estuvo presente hasta el final.
3.  **Genera el PDF de la velada:** Usa el botón *Descargar PDF* del encabezado; el sistema (`pdfGenerator`) captura la fecha, el lugar indicado en `location_name/location_details`, las mesas y las anécdotas para circulación del acta.
4.  **Cambia el estado a “Finalizada”:** Cuando todo esté listo, utiliza el botón *Finalizar Velada* en la cabecera. Este paso bloquea nuevas manos, congela estadísticas y evita reabrir la sesión por error.
5.  **Valida las cifras de control:** Compara el código de control impreso en el PDF con el que aparece en la página de estadísticas. Si no coinciden, pulsa *Actualizar* en el tablero o vuelve a generar el PDF para evitar discrepancias.

---

## Preguntas Frecuentes

**¿Qué pasa si me equivoco al anotar puntos?**
En la tarjeta de la mesa, verás un historial de las manos jugadas. Pulsa el icono de lápiz (editar) junto a la mano incorrecta para corregir los puntos.

**¿Puedo cancelar una mesa si se armó por error?**
Sí. Si la partida no ha terminado, busca el botón de opciones (tres puntos o icono de basura) en la tarjeta de la mesa para cancelarla. Los jugadores volverán a la banca.

**¿Necesito internet?**
Sí, la aplicación necesita conexión para guardar los datos en tiempo real y que todos los dispositivos vean la misma información.
