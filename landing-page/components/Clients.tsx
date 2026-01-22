import { clients } from "@/constants";
import styles from "@/styles/style";
import Image from "next/image";

const Clients: React.FC = () => (
  <section className={`${styles.flexCenter} my-4`}>
    <div className={`${styles.flexCenter} flex-wrap w-full`}>
      {clients.map((client, index) => (
        <div
          key={client.id}
          className={`flex-1 ${styles.flexCenter} sm:min-w-[192px] min-w-[120px] animate-fade-in-up hover:scale-110 transition-transform duration-300`}
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <Image
            src={client.logo}
            alt="client"
            className="sm:w-[192px] w-[100px] object-contain"
          />
        </div>
      ))}
    </div>
  </section>
);

export default Clients;
