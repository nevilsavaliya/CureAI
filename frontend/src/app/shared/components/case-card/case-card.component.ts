import { Component, Input, Output, EventEmitter } from '@angular/core';

export interface CaseCardData {
    _id: string;
    name: string;
    email: string;
    bloodGroup?: string;
    speciality?: string;
    status: 'pending' | 'ongoing' | 'treated' | 'rejected';
    createdAt: Date;
    unreadCount?: number;
}

@Component({
    selector: 'app-case-card',
    templateUrl: './case-card.component.html',
    styleUrls: ['./case-card.component.css']
})
export class CaseCardComponent {
    @Input() caseData!: CaseCardData;
    @Input() isActive: boolean = false;
    @Input() userType: 'doctor' | 'patient' = 'doctor';
    @Output() cardClick = new EventEmitter<CaseCardData>();

    getStatusClass(status: string): string {
        const statusClasses: { [key: string]: string } = {
            'pending': 'status-pending',
            'ongoing': 'status-ongoing',
            'treated': 'status-treated',
            'rejected': 'status-rejected'
        };
        return statusClasses[status] || '';
    }

    getStatusLabel(status: string): string {
        const labels: { [key: string]: string } = {
            'pending': 'Pending',
            'ongoing': 'Ongoing',
            'treated': 'Treated',
            'rejected': 'Rejected'
        };
        return labels[status] || status;
    }

    onClick(): void {
        this.cardClick.emit(this.caseData);
    }
}
