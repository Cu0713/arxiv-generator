import { useEffect, useState } from "react";
import "./App.css";
import axios from "axios";
import { XMLParser } from "fast-xml-parser";

const BASE_URL = "https://export.arxiv.org/api/query";

const fetchArxiv = async () => {
	const id = Math.floor(Math.random() * 100);
	const params = {
		search_query: "cat:math.RT",
		start: id.toString(),
		max_results: "1",
		sortBy: "submittedDate",
		sortOrder: "descending",
	};

	const res = await axios.get(BASE_URL, { params });
	const parser = new XMLParser({ ignoreAttributes: false });
	const feed = parser.parse(res.data);
	const entries = feed.feed.entry;
	return Array.isArray(entries) ? entries : [entries];
};

const fetchData = async () => {
	const id = Math.floor(Math.random() * 50) + 1;
	const response = await fetch(`${BASE_URL}/${id}/`);
	console.log(response);
	return response.json();
};

const App = () => {
	const [quote, setQuote] = useState<any>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [error, setError] = useState<any>(null);
	const isCoulombBranch: boolean = false;

	useEffect(() => {
		let active = true;

		const getArxiv = async () => {
			setIsLoading(true);
			setError(null);
			try {
				const arxivData = await fetchArxiv();
				const quote = arxivData[0];
				if (active) {
					setQuote(quote);
				}
			} catch (error) {
				console.error("Failed to fetch quote:", error);
				setError(error);
			} finally {
				setIsLoading(false);
			}
		};

		getArxiv();

		return () => {
			active = false;
		};
	}, []);

	const handleClick = async () => {
		setIsLoading(true);
		setError(null);
		try {
			const arxivData = await fetchArxiv();
			const quote = arxivData[0];
			setQuote(quote);
			console.log(quote);
		} catch (error) {
			console.error("Failed to fetch quote:", error);
			setError(error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen pt-16 pb-8 space-y-8">
			<div className="text-center space-y-8">
				<h1 className="text-5xl">Representation Theory arXiv ジェネレーター</h1>
				<p>
					ボタンを押したらランダムで arXiv の math.RT
					に投稿された論文が出てくるよ！
				</p>

				<button
					className="bg-black text-white flex mx-auto rounded-xl py-4 px-8"
					type="button"
					onClick={handleClick}
				>
					ボタンを押せ！
				</button>
			</div>
			<div className="flex justify-center">
				<div className="text-center">
					{isLoading ? (
						<div className="flex justify-center items-center h-32">
							<div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500" />
						</div>
					) : error ? (
						<div className="flex justify-center items-center h-36">
							<div className="text-red-500 text-center">
								<p>エラーが発生しました</p>
								<button
									type="button"
									onClick={handleClick}
									className="mt-4 bg-black text-white hover:bg-gray-700 flex mx-auto rounded-xl py-4 px-8"
								>
									再試行
								</button>
							</div>
						</div>
					) : (
						<>
							<p className="text-center text-xl">{quote?.title}</p>
							<p className="text-center">
								{Array.isArray(quote?.author)
									? quote.author.map((a, i) => (
											<span key={i}>
												{a.name}
												{i < quote?.author.length - 1 && ", "}
											</span>
										))
									: quote?.author.name}
							</p>
							<a href={quote?.id} target="_blank">
								{quote?.id}
							</a>
							<p className="text-center"></p>
						</>
					)}
				</div>
			</div>
		</div>
	);
};

export default App;
