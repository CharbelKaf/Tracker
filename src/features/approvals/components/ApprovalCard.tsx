import React from 'react';
import { Approval } from '../../../types';
import { cn } from '../../../lib/utils';
import MaterialIcon from '../../../components/ui/MaterialIcon';
import StatusBadge from '../../../components/ui/StatusBadge';
import Button from '../../../components/ui/Button';
import { UserAvatar } from '../../../components/ui/UserAvatar';
import SecurityGate from '../../../components/security/SecurityGate';

interface ApprovalCardProps {
    approval: Approval;
    onApprove?: (approval: Approval) => void;
    onReject?: (approval: Approval) => void;
    showActions?: boolean;
    stepDetails: {
        label: string;
        color: string;
        bg: string;
        icon: React.ReactNode;
        btnText: string;
    };
}

export const ApprovalCard: React.FC<ApprovalCardProps> = ({
    approval,
    onApprove,
    onReject,
    showActions = false,
    stepDetails
}) => {
    const isDelegated = approval.beneficiaryId && approval.beneficiaryId !== approval.requesterId;

    return (
        <div className="group flex flex-col bg-surface rounded-card shadow-elevation-1 border border-outline-variant overflow-hidden hover:border-primary/50 hover:shadow-elevation-3 transition-all duration-medium2 ease-emphasized relative">

            {/* Status Strip */}
            <div className={cn("h-1 w-full absolute top-0 left-0 z-10", stepDetails.bg.replace('bg-', 'bg-').replace('-container', ''))} />

            {/* Header */}
            <div className="px-5 py-3 flex items-center justify-between border-b border-outline-variant bg-surface-container-lowest/50">
                <div className="flex items-center gap-2">
                    <StatusBadge status={approval.status} className="scale-90 origin-left" />
                    {approval.urgency === 'high' && (
                        <span className="flex items-center gap-1 text-label-small font-bold text-error bg-error-container px-2 py-0.5 rounded-full uppercase tracking-wider border border-error/20">
                            <MaterialIcon name="emergency" size={12} /> Urgent
                        </span>
                    )}
                </div>
                <span className="text-label-small text-on-surface-variant font-mono">
                    #{approval.id.substring(0, 8)}
                </span>
            </div>

            {/* Body */}
            <div className="p-4 flex-1 flex flex-col gap-3">
                {/* Main Content: Image + Title */}
                <div className="flex gap-4">
                    <div className="w-16 h-16 bg-surface-container-high rounded-lg overflow-hidden shrink-0 border border-outline-variant/50 shadow-elevation-1 relative group-hover:scale-105 transition-transform duration-medium2">
                        <img
                            src={approval.image}
                            alt={approval.equipmentCategory}
                            className="w-full h-full object-cover mix-blend-multiply"
                            loading="lazy"
                        />
                        {approval.assignedEquipmentId && (
                            <div className="absolute bottom-0 right-0 p-0.5 bg-tertiary text-on-tertiary rounded-tl-md shadow-elevation-1">
                                <MaterialIcon name="check" size={12} />
                            </div>
                        )}
                    </div>

                    <div className="min-w-0 flex-1">
                        <h3 className="text-title-medium font-bold text-on-surface line-clamp-2 group-hover:text-primary transition-colors">
                            {approval.equipmentName}
                        </h3>
                        <p className="text-body-small text-on-surface-variant mt-0.5 line-clamp-2">
                            {approval.reason || "Aucune raison spécifiée."}
                        </p>
                    </div>
                </div>

                {/* People involved */}
                <div className="flex items-center justify-between mt-auto pt-2">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <UserAvatar
                                name={approval.requesterName}
                                src={undefined} // We might need to fetch avatars in a real app or pass them down
                                size="sm"
                                className="border-2 border-surface shadow-elevation-1"
                            />
                            {isDelegated && (
                                <div className="absolute -bottom-1 -right-1 bg-surface rounded-full p-px">
                                    <UserAvatar
                                        name={approval.beneficiaryName}
                                        src={undefined}
                                        size="xs"
                                        className="ring-1 ring-outline-variant"
                                    />
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-label-small text-on-surface font-medium leading-none">
                                {approval.requesterName}
                            </span>
                            {isDelegated && (
                                <span className="text-label-small text-on-surface-variant leading-none mt-1">
                                    pour {approval.beneficiaryName}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="text-right">
                        <p className="text-label-small text-on-surface-variant uppercase tracking-wider font-medium">Date</p>
                        <p className="text-label-small text-on-surface">
                            {new Date(approval.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            {showActions && onApprove && onReject && (
                <div className="px-4 py-3 bg-surface-container-low border-t border-outline-variant flex gap-3">
                    <SecurityGate
                        onVerified={() => onReject(approval)}
                        title="Refuser la demande"
                        description={`Voulez-vous vraiment refuser la demande de ${approval.requesterName} ?`}
                        entityId={approval.id}
                        trigger={
                            <Button
                                variant="outlined"
                                size="sm"
                                className="flex-1 text-on-surface-variant hover:text-error hover:bg-error-container/20 border border-outline-variant/50"
                            >
                                Refuser
                            </Button>
                        }
                    />

                    <SecurityGate
                        onVerified={() => onApprove(approval)}
                        title={stepDetails.btnText}
                        description="Confirmer cette action irréversible."
                        entityId={approval.id}
                        trigger={
                            <Button
                                variant="filled"
                                size="sm"
                                className="flex-1 shadow-elevation-1"
                                icon={stepDetails.icon}
                            >
                                {stepDetails.btnText}
                            </Button>
                        }
                    />
                </div>
            )}

            {/* Step Indicator (Non-actionable) */}
            {!showActions && (
                <div className="px-4 py-2 bg-surface-container-lowest border-t border-outline-variant flex items-center justify-center gap-2">
                    <span className={cn("w-2 h-2 rounded-full", stepDetails.bg.replace('bg-', 'bg-').replace('-container', ''))} />
                    <span className="text-label-small text-on-surface-variant uppercase track-widest">
                        {stepDetails.label}
                    </span>
                </div>
            )}
        </div>
    );
};

