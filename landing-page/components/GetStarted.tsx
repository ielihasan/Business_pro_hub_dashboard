import styles from "@/styles/style";
import { arrowUp } from "@/public/assets";
import Image from "next/image";
import Link from "next/link";

const GetStarted: React.FC = () => (
  <Link href="http://localhost:3001/auth/v1/login" target="_blank">
    <div
      className={`${styles.flexCenter} w-[140px] h-[140px] rounded-full bg-blue-gradient p-[2px] cursor-pointer hover:scale-110 transition-transform duration-300`}
    >
      <div
        className={`${styles.flexCenter} flex-col bg-primary w-[100%] h-[100%] rounded-full`}
      >
        <div className={`${styles.flexStart} flex-row`}>
          <p className="font-poppins font-medium text-[18px] leading-[23px] mr-2">
            <span className="text-gradient">Get</span>
          </p>
          <Image
            src={arrowUp}
            className="w-[23px] h-[23px] object-contain"
            alt="arrow"
          />
        </div>
        <p className="font-poppins font-medium text-[18px] leading-[23px]">
          <span className="text-gradient">Started</span>
        </p>
      </div>
    </div>
  </Link>
);

export default GetStarted;
