import "../styles/Toast.css";

type Props = {
  message: string;
  open: boolean;
};

export default function Toast({ message, open }: Props) {
  if (!open) return null;

  return (
    <div className="toast">
      <div className="toast-inner">{message}</div>
    </div>
  );
}
