import { stats } from "@/constants";
import styles from "@/styles/style";

const Stats: React.FC = () => (
  <section className={`${styles.flexCenter} flex-row flex-wrap sm:mb-20 mb-6`}>
    {stats.map((stat, index) => (
      <div
        key={stat.id}
        className={`flex-1 flex justify-start items-center flex-row m-3 animate-fade-in-up hover:scale-105 transition-transform duration-300`}
        style={{ animationDelay: `${index * 0.1}s` }}
      >
        <h4 className="font-poppins font-semibold xs:text-[40px] text-[30px] xs:leading-[53px] leading-[43px] text-white">
          {stat.value}
        </h4>
        <p className="font-poppins font-normal xs:text-[20px] text-[15px] xs:leading-[26px] leading-[21px] text-gradient uppercase ml-3">
          {stat.title}
        </p>
      </div>
    ))}
  </section>
);

export default Stats;
