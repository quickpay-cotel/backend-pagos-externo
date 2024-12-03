
export class FuncionesFechas {
    static formatDateToDDMMYYYY(date: Date): string {
        const day = String(date.getDate()).padStart(2, '0'); // Día con dos dígitos
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Mes con dos dígitos
        const year = date.getFullYear(); // Año completo
        return `${day}/${month}/${year}`;
    };
}


