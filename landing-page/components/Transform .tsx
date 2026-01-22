import styles from "@/styles/style";
import Button from "./Button";

const CTA: React.FC = () => (
  <section
    className={`${styles.flexCenter} ${styles.marginY} ${styles.padding} sm:flex-row flex-col bg-black-gradient-2 rounded-[20px] box-shadow`}
  >
    <div className="flex-1 flex flex-col animate-fade-in-left">
      <h2 className={`${styles.heading2} font-poppins`}>
        Ready to transform your business?
      </h2>
      <p className={`${styles.paragraph} font-poppins max-w-[470px] mt-5`}>
        Join hundreds of service businesses who are already reducing wait times by 60% and increasing customer satisfaction with our intelligent queue management platform.
      </p>
    </div>
    <div
      className={`${styles.flexCenter} sm:ml-10 ml-0 sm:mt-0 mt-10 animate-fade-in-right`}
    >
      <Button />
    </div>
  </section>
);

export default CTA;
