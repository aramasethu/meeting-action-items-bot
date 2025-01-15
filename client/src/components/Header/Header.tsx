import "./Header.css";

const Header = () => {
  return (
    <div className="Header">
  <img
    className="Header--logo"
    src="../assets/prediction_guard_1x1_light_background.svg"
    alt="My Logo"
  />
  <div>
    <h1 className="Header--heading">Prediction Guard Meeting Bot</h1>
  </div>
</div>
  );
};

export default Header;