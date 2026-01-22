import { card } from "@/public/assets";
import styles, { layout } from "@/styles/style";
import Button from "./Button";
import Image from "next/image";

const CardDeal: React.FC = () => (
  <section className={`${layout.section}`}>
    <div className={`${layout.sectionInfo} animate-fade-in-left`}>
      <h2 className={`${styles.heading2} font-poppins`}>
        Find a better card deal <br className="sm:block hidden" />
        in few easy steps.
      </h2>
      <p
        className={`${styles.paragraph} font-poppins max-w-[470px] mt-5 animate-fade-in-left animation-delay-200`}
      >
        Access exclusive student discounts and payment plans. Our token-based
        system offers flexible pricing options, allowing you to purchase
        printing credits in bulk at discounted rates. No hidden fees, complete
        transparency.
      </p>
      <Button styles="mt-10 animate-fade-in-left animation-delay-400" />
    </div>
    <div className={`${layout.sectionImg} animate-fade-in-right`}>
      <Image src={card} alt="card" className="w-[100%] h-[100%]" />
    </div>
  </section>
);

export default CardDeal;
