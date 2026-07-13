import "../style/form-group.scss";

const FormGroup = ({ label, type = "text", placeholder, value, onChange }) => {
  return (
    <div className="form-group">
      <label htmlFor={label}>{label}</label>

      <input
        value={value}
        onChange={onChange}
        type={type}
        id={label}
        name={label}
        placeholder={placeholder}
      />
    </div>
  );
};

export default FormGroup;

