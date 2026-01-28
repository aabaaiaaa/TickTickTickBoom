import './SerialNumber.css';

interface SerialNumberProps {
    serial: string;
}

export function SerialNumber({ serial }: SerialNumberProps) {
    return (
        <div className="serial-number" data-testid="serial-number">
            <span className="serial-label">SERIAL</span>
            <span className="serial-value">{serial}</span>
        </div>
    );
}
