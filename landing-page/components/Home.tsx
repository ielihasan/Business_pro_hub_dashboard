import styles from "@/styles/style";
import { discount, robot } from "@/public/assets";
import GetStarted from "./GetStarted";
import Image from "next/image";

const Hero: React.FC = () => (
  <section id="home" className={`flex md:flex-row flex-col ${styles.paddingY}`}>
    <div
      className={`flex-1 ${styles.flexStart} flex-col xl:px-0 sm:px-16 px-6`}
    >
      <div className="flex flex-row items-center py-[6px] px-4 bg-discount-gradient rounded-[10px] mb-2 animate-fade-in-down">
        <Image src={discount} alt="discount" className="w-[32px] h-[32px]" />
        <p className="font-poppins text-dimWhite text-[18px] leading-[30.8px] ml-2">
          Available For{" "}
          <span className="text-white">All Service Businesses</span>
        </p>
      </div>
      <div className="flex flex-row justify-between items-center w-full">
        <h1 className="flex-1 font-poppins font-semibold ss:text-[72px] text-[52px] text-white ss:leading-[100px] leading-[75px] animate-fade-in-left">
          The Next <br className="sm:block hidden" />{" "}
          <span className="text-gradient">Generation</span>{" "}
        </h1>
        <div className="ss:flex hidden md:mr-4 mr-0 animate-fade-in-right">
          <GetStarted />
        </div>
      </div>
      <h1 className="w-full font-poppins font-semibold ss:text-[68px] text-[52px] text-white ss:leading-[100px] leading-[75px] animate-fade-in-left animation-delay-200">
        Queue Management <br className="sm:block hidden" />{" "}
        <span className="text-gradient">Platform</span>
      </h1>
      <p className="font-poppins text-dimWhite text-[18px] leading-[30.8px] max-w-[470px] mt-5 animate-fade-in-up animation-delay-400">
        BusinessHub Pro revolutionizes customer flow management with intelligent real-time queue optimization. Join queues remotely via QR codes, receive accurate wait time predictions, and enjoy seamless service experiences with automated notifications and digital order submission.
      </p>
    </div>
    <div className={`${styles.flexCenter} flex-1 flex md:my-0 my-10 relative`}>
      <Image
        src={robot}
        alt="BusinessHub Pro"
        className="w-[100%] h-[100%] relative z-[5] animate-float"
      />
      <div className="absolute z-[0] w-[40%] h-[35%] top-0 pink__gradient animate-pulse-slow" />
      <div className="absolute z-[1] w-[80%] h-[80%] rounded-full bottom-40 white__gradient animate-pulse-slow animation-delay-200" />
      <div className="absolute z-[0] w-[50%] h-[50%] right-20 bottom-20 blue__gradient animate-pulse-slow animation-delay-400" />
    </div>
    <div className={`${styles.flexCenter} ss:hidden animate-fade-in-up`}>
      <GetStarted />
    </div>
  </section>
);

export default Hero;
