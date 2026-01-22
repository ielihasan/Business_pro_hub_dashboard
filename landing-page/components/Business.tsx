import styles, { layout } from "@/styles/style";
import { features } from "@/constants";
import Button from "./Button";
import Image from "next/image";
import { FeatredCardProps } from "@types";

const FeaturesCard: React.FC<FeatredCardProps> = ({
  icon,
  title,
  content,
  index,
}) => (
  <div
    className={`flex flex-row p-6 rounded-[20px] ${
      index !== features.length - 1 ? "mb-6" : "mb-0"
    } feature-card animate-fade-in-right transition-all duration-300 hover:scale-105`}
    style={{ animationDelay: `${index * 0.2}s` }}
  >
    <div
      className={`w-[64px] h-[64px] rounded-full bg-dimBlue ${styles.flexCenter}`}
    >
      <Image src={icon} alt="icon" className="w-[50%] h-[50%] object-contain" />
    </div>
    <div className="flex-1 flex flex-col ml-3">
      <h4 className="font-poppins font-semibold text-white text-[18px] leading-[24px]">
        {title}
      </h4>
      <p className="font-poppins font-normal text-dimWhite text-[16px] leading-[24px]">
        {content}
      </p>
    </div>
  </div>
);

const Business: React.FC = () => (
  <section id="features" className={`${layout.section}`}>
    <div className={`${layout.sectionInfo} animate-fade-in-left`}>
      <h2 className={`${styles.heading2} font-poppins`}>
        Focus on your business, <br className="sm:block hidden" />
        We'll handle the queues.
      </h2>
      <p
        className={`${styles.paragraph} font-poppins max-w-[470px] mt-5 animate-fade-in-left animation-delay-200`}
      >
        BusinessHub Pro revolutionizes your customer service operations by
        automating queue management. Monitor real-time customer flow, optimize
        staff allocation, and reduce wait times with our AI-powered system.
        Improve customer satisfaction with intelligent queue analytics and
        automated notifications.
      </p>
      <Button styles="mt-10 animate-fade-in-left animation-delay-400" />
    </div>
    <div className={`${layout.sectionImg} flex-col`}>
      {features.map((feature, index) => (
        <FeaturesCard key={feature.id} {...feature} index={index} />
      ))}
    </div>
  </section>
);

export default Business;
