import { card } from "@/public/assets";
import styles, { layout } from "@/styles/style";
import Button from "./Button";
import Image from "next/image";

const CardDeal: React.FC = () => (
  <section className={`${layout.section}`}>
    <div className={`${layout.sectionInfo} animate-fade-in-left`}>
      <h2 className={`${styles.heading2} font-poppins`}>
        Flexible Business Plans <br className="sm:block hidden" />
        <span className="text-gradient">for Every Size</span>
      </h2>
      <p
        className={`${styles.paragraph} font-poppins max-w-[470px] mt-5 animate-fade-in-left animation-delay-200`}
      >
        Access scalable subscription packages tailored to your business needs. Our flexible pricing supports single locations to multi-branch chains with features like QR check-in, SMS notifications, analytics dashboards, and priority support. No hidden fees, complete transparency.
      </p>
      <Button styles="mt-10 animate-fade-in-left animation-delay-400" />
    </div>
    <div className={`${layout.sectionImg} animate-fade-in-right`}>
      <Image src={card} alt="business plans" className="w-[100%] h-[100%]" />
    </div>
  </section>
);

export default CardDeal;
