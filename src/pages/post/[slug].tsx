/* eslint-disable react/jsx-no-comment-textnodes */
import { GetStaticPaths, GetStaticProps } from 'next';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { MdOutlineWatchLater } from 'react-icons/md';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { RichText } from 'prismic-dom';
import { getPrismicClient } from '../../services/prismic';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Header from '../../components/Header';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    last_publication_date: string | null;
    content: {
      heading: string;
      body: string;
    };
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  function timeRead(): number {
    const AllText = (
      post.data.content.heading + post.data.content.body
    ).replace(/(<([^>]+)>)/gi, '');
    const TextArray = AllText.split(' ');
    const countWords = TextArray.join('').length;
    return Math.ceil(countWords / 200);
  }
  const timeToRead = timeRead();
  return (
    <div className={commonStyles.content}>
      <div className={styles.header}>
        <Header />
      </div>
      <div
        className={styles.banner}
        style={{
          backgroundImage: `url(${post.data.banner.url})`,
        }}
      />
      <main className={commonStyles.main}>
        <div className={styles.container}>
          <div className={styles.title}>
            <h1>{post.data.title}</h1>
            <span>
              <time>
                <FiCalendar />
                {post.first_publication_date}
              </time>
              <p>
                <FiUser />
                {post.data.author}
              </p>
              <time>
                <MdOutlineWatchLater />
                {timeToRead} min
              </time>
            </span>
          </div>
          <h3>{post.data.content.heading}</h3>
          <div dangerouslySetInnerHTML={{ __html: post.data.content.body }} />
        </div>
      </main>
    </div>
  );
}

export const getStaticPaths: any = () => {
  return {
    paths: [],
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();

  const response = await prismic.getByUID('blogpost', String(slug), {});
  const post = {
    first_publication_date: format(
      new Date(response.first_publication_date),
      'dd MMM yyyy',
      {
        locale: ptBR,
      }
    ),
    data: {
      title: RichText.asText(response.data.title),
      author: RichText.asText(response.data.author),
      banner: {
        url: response.data.banner.url,
      },
      content: {
        heading: RichText.asText(response.data.content[0].heading),
        body: RichText.asHtml(response.data.content[0].body),
      },
    },
  };
  return {
    props: { post },
    redirect: 60 * 30,
  };
};
