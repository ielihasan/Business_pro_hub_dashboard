import { quotes } from "@/public/assets";
import { FeedbackCardProps } from "@types";
import Image from "next/image";

const FeedbackCard: React.FC<FeedbackCardProps> = ({
  content,
  name,
  title,
  img,
  index,
}) => (
  <div
    className="flex justify-between flex-col px-10 py-12 rounded-[20px] max-w-[370px] md:mr-10 sm:mr-5 mr-0 my-5 feedback-card animate-fade-in-up hover:scale-105 transition-all duration-300"
    style={{ animationDelay: `${index * 0.1}s` }}
  >
    <Image
      src={quotes}
      alt="double_quotes"
      className="w-[42px] h-[27px] object-contain"
    />
    <p className="font-poppins font-normal text-[18px] leading-[32px] text-white my-10">
      {content}
    </p>
    <div className="flex flex-row">
      <Image src={img} alt={name} className="w-[48px] h-[48px] rounded-full" />
      <div className="flex flex-col ml-4">
        <h4 className="font-poppins font-semibold text-[20px] leading-[32px] text-white">
          {name}
        </h4>
        <p className="font-poppins font-normal text-[16px] leading-[24px] text-dimWhite">
          {title}
        </p>
      </div>
    </div>
  </div>
);

export default FeedbackCard;
